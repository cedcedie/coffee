-- ============================================
-- Create Web Orders Table for public checkout
-- ============================================

CREATE TABLE IF NOT EXISTS web_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  payment_method TEXT,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_orders_email ON web_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_web_orders_created_at ON web_orders(created_at DESC);

ALTER TABLE web_orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public checkout)
CREATE POLICY "Allow anonymous inserts"
  ON web_orders
  FOR INSERT
  WITH CHECK (true);

-- Allow anonymous reads (client-side filtering by email)
CREATE POLICY "Allow anonymous read"
  ON web_orders
  FOR SELECT
  USING (true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_web_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS web_orders_updated_at_trigger ON web_orders;
CREATE TRIGGER web_orders_updated_at_trigger
  BEFORE UPDATE ON web_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_web_orders_updated_at();


