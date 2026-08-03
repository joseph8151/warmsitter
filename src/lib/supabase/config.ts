// Central place to read Supabase config and decide whether it's enabled.
// When not configured, the app falls back to the demo auth stub.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const AVATARS_BUCKET = process.env.SUPABASE_AVATARS_BUCKET ?? "avatars";
export const WORKLOGS_BUCKET = process.env.SUPABASE_WORKLOGS_BUCKET ?? "worklogs";

// Auth/session features require the public URL + anon key.
export const isSupabaseAuthEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Server-side Storage uploads require the service-role key too.
export const isSupabaseStorageEnabled = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
