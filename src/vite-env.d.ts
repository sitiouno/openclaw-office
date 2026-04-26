/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_GATEWAY_TOKEN: string;
  readonly VITE_REGISTRY_API_URL?: string;
  readonly VITE_REGISTRY_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
