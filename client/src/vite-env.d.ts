/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SESSION_DURATION_MINUTES?: string;
  readonly VITE_LANGUAGES?: string;
  readonly VITE_DEFAULT_LANGUAGE?: string;
  readonly VITE_STAFF_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
