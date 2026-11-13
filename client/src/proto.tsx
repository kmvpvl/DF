import React from 'react';
import { IMLString, mlStrings, MLString } from './mlstring';
import { I18nContext, I18nContextValue } from './i18n/I18nContext';
import { ICompany } from '@betypes/company';

export enum ProtoErrorCode {
  serverNotAvailable,
  httpError,
  authDataExpected,
  serverBroken,
}

export interface IProtoProps {
  user?: User | null;
  companyInfo?: ICompany | null;
  currentLocation?: string | null;
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/graphql`;

export interface User {
  id: string;
  name: string;
  fullName: string;
  entityType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  email: string;
  phone?: string | null;
  pib?: string | null;
  mbr?: string | null;
  account?: string | null;
  bank?: string | null;
  pushSubscription?: object | null;
}

export interface IProtoState {
  user?: User | null;
  companyInfo?: ICompany | null;
  currentLocation?: string | null;
}
export default class Proto<
  IProps extends IProtoProps,
  IState extends IProtoState,
> extends React.Component<IProps, IState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;
  state: Readonly<IState> = {
    user: this.props.user,
    companyInfo: this.props.companyInfo,
    currentLocation: this.props.currentLocation,
  } as IState;

  protected getLanguage(): string {
    return this.context?.language ?? 'en';
  }

  protected toString(mlString?: IMLString, lang?: string): string {
    if (mlString === undefined) return '';
    const mls = new MLString(mlString);
    return mls.toString(lang === undefined ? this.getLanguage() : lang);
  }

  protected ML(str?: string, lang?: string): string {
    if (lang === undefined) {
      lang = this.getLanguage();
    }
    if (str === undefined) {
      console.warn('Empty or undefined string');
      return ``;
    }
    if (lang === undefined) return str;
    if (!mlStrings.has(str)) {
      console.warn(`String '${str}' is absent`);
      return str;
    }
    const el = mlStrings.get(str);
    if (!el?.has(lang)) return str;
    if (el.get(lang) === undefined) return str;
    return el.get(lang) as string;
  }

  protected toCurrency(x: number): string {
    return Intl.NumberFormat(this.getLanguage(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(x);
  }
  protected toFixed(x: number): string {
    return Intl.NumberFormat(this.getLanguage(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(x);
  }
  protected toInteger(x: number): string {
    return Intl.NumberFormat(this.getLanguage(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(x);
  }
  protected toLocalDate(x: string | Date) {
    return typeof x === 'string'
      ? new Date(x).toLocaleString([this.getLanguage()], {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : x.toLocaleString([this.getLanguage()], {
          dateStyle: 'short',
          timeStyle: 'short',
        });
  }

  protected gql = async (
    query: string,
    variables: Record<string, unknown> = {}
  ) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'df-company-id': '088e3a63cbcd11f1ba2cd256a398ea10',
        'df-location-id': '233c58f8cbcd11f1ba2cd256a398ea10',
      },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });

    const json = (await response.json()) as {
      data?: Record<string, unknown>;
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    return json.data as Record<string, unknown>;
  };
}
