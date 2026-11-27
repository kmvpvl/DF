export type IMLString =
  | string
  | {
      default: string;
      // Используем простой объект вместо массива кортежей
      ts: Record<string, string>;
    };
