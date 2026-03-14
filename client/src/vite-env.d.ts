/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string;
	readonly VITE_SESSION_DURATION_MINUTES?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
