-- ============================================
-- Create Orders Table
-- ============================================
-- Run this in Supabase SQL Editor
-- Go to: Dashboard → SQL Editor → New Query → Paste this → Run

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Policy: Users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own orders
CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own orders
CREATE POLICY "Users can delete their own orders"
  ON orders
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Function to automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Success! Your orders table is ready.
-- ============================================




