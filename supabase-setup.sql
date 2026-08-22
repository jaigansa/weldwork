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
  with check (true);

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
  name text not null,
  phone text not null,
  email text,
  message text,
  attachments jsonb default '[]'::jsonb,
  status text not null default 'new',
  lang text default 'en',
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

drop policy if exists "anon_insert_quotes" on public.quotes;
create policy "anon_insert_quotes"
  on public.quotes for insert
  to anon
  with check (true);

insert into storage.buckets (id, name, public)
values ('quote-attachments', 'quote-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "anon_upload_quote_photos" on storage.objects;
create policy "anon_upload_quote_photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'quote-attachments');

-- Done. Manage data at:
--   Dashboard > Table Editor > ratings   (customer reviews)
--   Dashboard > Table Editor > quotes    (set status: new / quoted / won / lost)
--   Dashboard > Storage > quote-attachments (uploaded photos)
