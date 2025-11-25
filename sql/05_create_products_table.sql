-- ============================================
-- Create Products Table
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  category_label TEXT,
  badge TEXT,
  description TEXT,
  image_url TEXT,
  availability TEXT DEFAULT 'In stock',
  cta_theme TEXT DEFAULT 'green',
  default_size TEXT,
  size_option TEXT DEFAULT 'Single size',
  price NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
  sizes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Anon manage products"
  ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at_trigger ON products;
CREATE TRIGGER products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_products_updated_at();

