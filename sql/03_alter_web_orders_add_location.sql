-- ============================================
-- Add location column to web_orders
-- ============================================

ALTER TABLE web_orders
ADD COLUMN IF NOT EXISTS location JSONB;

-- No RLS change needed; inherits existing policies

