-- 003: Track which company a quote request belongs to.
-- Nullable: rows submitted before this column exist stay null.

alter table public.quotes add column if not exists company_name text;
