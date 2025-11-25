-- ============================================
-- Add optional GCash metadata columns
-- ============================================

ALTER TABLE web_orders
  ADD COLUMN IF NOT EXISTS gcash_number TEXT,
  ADD COLUMN IF NOT EXISTS gcash_account_name TEXT;

