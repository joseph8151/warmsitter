-- Security hardening: enable Row Level Security (RLS) on every app table.
--
-- The app reaches the database ONLY through Prisma, connecting as the table
-- owner (postgres) role, which bypasses RLS — so the app is unaffected. No
-- browser/anon code ever queries these tables through Supabase's auto REST API
-- (the Supabase client is used only for Auth and Realtime Broadcast, and
-- storage.from() targets Storage buckets, not tables).
--
-- With RLS enabled and NO policies, the public anon/authenticated roles are
-- denied all table access via PostgREST, resolving the Supabase advisor's
-- "rls_disabled_in_public" finding. Statement is idempotent.
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables
    where schemaname = 'public' and tablename <> '_prisma_migrations'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;
