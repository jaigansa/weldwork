-- ============================================================
-- WeldWork — Supabase one-time setup
-- Run in Supabase Dashboard > SQL Editor
-- Safe to run multiple times (idempotent).
--
-- Section 1: Shop ratings  (SKIP if ratings already work)
-- Section 2: Get Quote feature (required once)
-- ============================================================

-- ------------------------------------------------------------
-- SECTION 1: Shop Ratings
-- Used by: public/js/app.js (fetchAndRenderRatings,
-- fetchAndRenderReviews, initCustomRating submit)
-- Anonymous visitors can insert a rating and read ratings.
-- Inserts are throttled and length-limited to blunt spam.
-- ------------------------------------------------------------

create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  shop_id text not null,
  rating int not null check (rating between 1 and 5),
  name text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;

drop policy if exists "anon_insert_ratings" on public.ratings;
create policy "anon_insert_ratings"
  on public.ratings for insert
  to anon
  with check (
    char_length(coalesce(name, '')) <= 80
    and char_length(coalesce(message, '')) <= 1000
    -- Global throttle: at most one rating every 30s across all visitors.
    -- Blocks scripted bulk spam; strict per-user limits need an edge function.
    and not exists (
      select 1 from public.ratings r
      where r.created_at > now() - interval '30 seconds'
    )
  );

drop policy if exists "anon_select_ratings" on public.ratings;
create policy "anon_select_ratings"
  on public.ratings for select
  to anon
  using (true);

-- ------------------------------------------------------------
-- SECTION 2: Get Quote
-- 2a. Quotes table — every quote request is stored here.
--     Manage statuses (new / quoted / won / lost) in Table Editor.
-- 2b. Storage bucket — optional customer photos (up to 4),
--     compressed client-side before upload.
-- ------------------------------------------------------------

create table if not exists public.quotes (
  id bigint generated always as identity primary key,
  product_title text,
  product_category text,
  product_rate text,
  company_name text,
  name text not null,
  phone text not null,
  email text,
  message text,
  attachments jsonb default '[]'::jsonb,
  status text not null default 'new',
  lang text default 'en',
  created_at timestamptz not null default now()
);

-- Older deployments: add the column without recreating the table
alter table public.quotes add column if not exists company_name text;

alter table public.quotes enable row level security;

-- Length limits on free-text fields (idempotent)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'quotes_name_len') then
    alter table public.quotes add constraint quotes_name_len check (char_length(name) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_phone_len') then
    alter table public.quotes add constraint quotes_phone_len check (char_length(phone) <= 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_message_len') then
    alter table public.quotes add constraint quotes_message_len check (char_length(coalesce(message, '')) <= 2000);
  end if;
end $$;

drop policy if exists "anon_insert_quotes" on public.quotes;
create policy "anon_insert_quotes"
  on public.quotes for insert
  to anon
  with check (
    -- Global throttle: at most one quote every 15s across all visitors.
    not exists (
      select 1 from public.quotes q
      where q.created_at > now() - interval '15 seconds'
    )
  );

-- Storage bucket — optional customer photos (up to 4),
-- compressed client-side before upload.
-- NOTE: bucket stays public because publicUrls are persisted in
-- quotes.attachments for owner review. Uploads are locked down instead:
-- anon can only write image files <= 5MB into quotes/*.
insert into storage.buckets (id, name, public)
values ('quote-attachments', 'quote-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "anon_upload_quote_photos" on storage.objects;
create policy "anon_upload_quote_photos"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'quote-attachments'
    and (storage.foldername(name))[1] = 'quotes'
    and coalesce(metadata->>'mimetype', '') in ('image/jpeg', 'image/png', 'image/webp')
  );

-- Server-side size guard (metadata.size is computed by the storage layer)
create or replace function public.enforce_attachment_size()
returns trigger as $$
begin
  if new.bucket_id = 'quote-attachments'
     and coalesce((new.metadata->>'size')::bigint, 0) > 5 * 1024 * 1024 then
    raise exception 'Attachment exceeds 5MB limit';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_quote_attachment_size on storage.objects;
create trigger enforce_quote_attachment_size
  before insert on storage.objects
  for each row execute function public.enforce_attachment_size();

-- Done. Manage data at:
--   Dashboard > Table Editor > ratings   (customer reviews)
--   Dashboard > Table Editor > quotes    (set status: new / quoted / won / lost)
--   Dashboard > Storage > quote-attachments (uploaded photos)
