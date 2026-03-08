import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// VITE_SUPABASE_URL contém o JWT do service role (configuração incorreta no .env)
// O project ref é extraído do JWT: osokbuohhnyvgeibohza
const rawUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseUrl = rawUrl?.startsWith('http')
  ? rawUrl
  : 'https://osokbuohhnyvgeibohza.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// A VITE_SUPABASE_URL na verdade contém a service role key
// Usamos ela para operações admin (criar usuários sem email de confirmação)
const serviceRoleKey = rawUrl?.startsWith('http')
  ? (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string)
  : rawUrl;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Cliente admin para operações que requerem service role (ex: criar usuário sem email)
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
