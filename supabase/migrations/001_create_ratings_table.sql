-- ============================================
-- WeldWork Ratings Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by shop_id
CREATE INDEX IF NOT EXISTS idx_ratings_shop_id ON ratings (shop_id);

-- Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read ratings
CREATE POLICY "Public read access" ON ratings
  FOR SELECT USING (true);

-- Allow anyone to insert ratings (no auth required)
CREATE POLICY "Public insert access" ON ratings
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Optional: Seed some initial data
-- Uncomment the lines below if you want sample ratings
-- ============================================
-- INSERT INTO ratings (shop_id, rating, name, message) VALUES
--   ('site', 5, 'Ravi K.', 'Excellent fabrication work!'),
--   ('site', 4, 'Priya S.', 'Good quality and fast delivery.'),
--   ('site', 5, 'Kumar M.', 'Highly recommended for industrial welding.');
