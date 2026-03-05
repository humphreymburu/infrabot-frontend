/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_ALT_PROVIDER: string;
  readonly VITE_ALT_MODEL: string;
  readonly VITE_KIMI_API_KEY: string;
  readonly VITE_QWEN_API_KEY: string;
  readonly VITE_MINIMAX_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __reportError?: (msg: string) => void;
  }
}
