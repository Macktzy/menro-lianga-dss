import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — only active when VITE_SUPABASE_SERVICE_ROLE_KEY is set.
// Used exclusively for admin operations (e.g. creating driver auth accounts).
// ⚠️  Pilot-test only. Move to a backend/edge function before going to production.
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;