/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    CAPACITOR_SUPABASE?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
    Capacitor: {
      getPlatform: () => string;
      Plugins: {
        CapacitorSupabase?: {
          getEnvironmentVariable: (options: { key: string }) => Promise<{ value: string }>;
        };
      };
    };
  }
}
