import { Capacitor } from '@capacitor/core';

// Define types for environment variables
type SupabaseConfig = {
  url: string;
  anonKey: string;
};

// Default values (will be overridden by environment variables)
const defaultConfig: SupabaseConfig = {
  url: '',
  anonKey: '',
};

// Get environment variables based on the platform
export const getSupabaseConfig = (): SupabaseConfig => {
  // In web environment
  if (typeof import.meta.env !== 'undefined') {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }

  // In Capacitor environment
  if (Capacitor.isNativePlatform()) {
    try {
      // For Android, we'll inject these values at runtime
      const capacitorWindow = window as unknown as {
        CAPACITOR_SUPABASE?: {
          SUPABASE_URL?: string;
          SUPABASE_ANON_KEY?: string;
        };
      };

      if (capacitorWindow.CAPACITOR_SUPABASE) {
        return {
          url: capacitorWindow.CAPACITOR_SUPABASE.SUPABASE_URL || '',
          anonKey: capacitorWindow.CAPACITOR_SUPABASE.SUPABASE_ANON_KEY || '',
        };
      }
    } catch (error) {
      console.warn('Error reading Supabase config from Capacitor:', error);
    }
  }

  return defaultConfig;
};

export const supabaseConfig = getSupabaseConfig();
