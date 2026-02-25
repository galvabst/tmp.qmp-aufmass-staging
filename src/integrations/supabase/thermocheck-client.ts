import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://keplsvhudmfaagixttql.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY";

/**
 * Dedicated Supabase client for the `thermocheck` schema.
 * Uses the same auth session (shared localStorage) as the main client.
 * All queries via this client automatically target thermocheck.* tables.
 */
export const supabaseTC = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'thermocheck' },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
