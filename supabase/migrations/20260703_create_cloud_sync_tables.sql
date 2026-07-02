-- TaxFlow Cloud Sync: Create tables for cross-device data synchronization
-- Date: 2026-07-03

-- ==========================================
-- 1. Clients table
-- ==========================================
CREATE TABLE sf_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  company TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT '',
  vat_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sf_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients" ON sf_clients
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_sf_clients_user ON sf_clients(user_id);

-- ==========================================
-- 2. Invoices table
-- ==========================================
CREATE TABLE sf_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES sf_clients(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  currency TEXT NOT NULL DEFAULT 'USD',
  local_currency TEXT,
  exchange_rate NUMERIC,
  payment_date DATE,
  payment_rate NUMERIC,
  vat_type TEXT DEFAULT 'none' CHECK (vat_type IN ('none','standard','reverse_charge','exempt')),
  vat_number TEXT,
  buyer_vat_number TEXT,
  template TEXT DEFAULT 'us' CHECK (template IN ('us','eu','uk')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  ocr_processed BOOLEAN DEFAULT false,
  ocr_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sf_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices" ON sf_invoices
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_sf_invoices_user ON sf_invoices(user_id);
CREATE INDEX idx_sf_invoices_status ON sf_invoices(user_id, status);

-- ==========================================
-- 3. Settings table (one per user)
-- ==========================================
CREATE TABLE sf_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  business_email TEXT DEFAULT '',
  business_country TEXT DEFAULT '',
  default_currency TEXT DEFAULT 'USD',
  default_vat_type TEXT DEFAULT 'none',
  default_vat_number TEXT DEFAULT '',
  default_template TEXT DEFAULT 'us',
  tax_rate NUMERIC DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sf_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON sf_settings
  FOR ALL USING (user_id = auth.uid());

CREATE UNIQUE INDEX idx_sf_settings_user ON sf_settings(user_id);

-- ==========================================
-- 4. Auto-update updated_at trigger
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sf_invoices_updated_at
  BEFORE UPDATE ON sf_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_sf_settings_updated_at
  BEFORE UPDATE ON sf_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
