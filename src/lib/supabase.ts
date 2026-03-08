import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// VITE_SUPABASE_URL contém o JWT do service role (configuração incorreta no .env)
// O project ref é extraído do JWT: osokbuohhnyvgeibohza
const rawUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseUrl = rawUrl?.startsWith('http')
  ? rawUrl
  : 'https://osokbuohhnyvgeibohza.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
