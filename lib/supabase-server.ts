/**
 * Supabase Server Client
 *
 * Uses the service role key so it can read/write any row.
 * Communicates via HTTPS (port 443) — no PostgreSQL port needed.
 * Safe to use only in server-side code (API routes, Server Components).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Singleton pattern to avoid creating a new client on every request
let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

export const supabase: any = getSupabase();
