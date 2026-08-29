-- ============================================
-- Supabase SQL Setup for WeldWork Ratings Backend
-- Run this script in your Supabase SQL Editor
-- ============================================

-- 1. Create ratings table
create table if not exists public.ratings (
  id uuid default gen_random_uuid() primary key,
  shop_id text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  author_name text,
  review_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create index on shop_id for fast queries
create index if not exists idx_ratings_shop_id on public.ratings(shop_id);

-- 3. Enable Row Level Security (RLS)
alter table public.ratings enable row level security;

-- 4. Create RLS Policy: Allow public read access
create policy "Allow public read access"
  on public.ratings
  for select
  using (true);

-- 5. Create RLS Policy: Allow public insert access
create policy "Allow public insert access"
  on public.ratings
  for insert
  with check (true);
