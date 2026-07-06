import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if a string is a standard placeholder
const isPlaceholder = (val: string) => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('placeholder') ||
    lower.includes('your-') ||
    lower.includes('your_') ||
    lower.includes('changeme') ||
    lower.includes('insert_') ||
    lower.includes('example') ||
    lower === 'url' ||
    lower === 'key'
  );
};

// Initialize Supabase Client if not using placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !isPlaceholder(supabaseUrl) && 
  !isPlaceholder(supabaseAnonKey)
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Access safe Supabase client with a descriptive error if not configured
 */
export function getSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your secrets or .env file.'
    );
  }
  return supabase;
}

