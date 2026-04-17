import React from 'react';
import { IMLString, mlStrings, MLString } from './mlstring';
import { I18nContext, I18nContextValue } from './i18n/I18nContext';

export enum ProtoErrorCode {
  serverNotAvailable,
  httpError,
  authDataExpected,
  serverBroken,
}

export interface IProtoProps {}

export interface IProtoState {}
export default class Proto<
  IProps extends IProtoProps,
  IState extends IProtoState,
> extends React.Component<IProps, IState> {
  static contextType = I18nContext;
  declare context: I18nContextValue | null;

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
    return typeof x === 'string' ?
      new Date(x).toLocaleString([this.getLanguage()], { dateStyle: 'short', timeStyle: 'short' })
      :
      x.toLocaleString([this.getLanguage()], { dateStyle: 'short', timeStyle: 'short' })
  }
}
