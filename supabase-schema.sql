-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- TaxFlow Database Schema — Last updated: 2026-07-05

-- ==========================================
-- Subscriptions (取代旧 licenses 表)
-- ==========================================
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'canceled', 'past_due', 'expired', 'pending')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role
  USING (true);

-- ==========================================
-- Cloud Sync: Clients
-- ==========================================
CREATE TABLE sf_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  company TEXT,
  address TEXT,
  country TEXT DEFAULT '',
  vat_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sf_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients" ON sf_clients
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- Cloud Sync: Invoices
-- ==========================================
CREATE TABLE sf_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES sf_clients(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  currency TEXT DEFAULT 'USD',
  local_currency TEXT,
  exchange_rate NUMERIC,
  payment_date DATE,
  payment_rate NUMERIC,
  vat_type TEXT DEFAULT 'none' CHECK (vat_type IN ('none', 'standard', 'reverse_charge', 'exempt')),
  vat_number TEXT,
  buyer_vat_number TEXT,
  template TEXT DEFAULT 'us' CHECK (template IN ('us', 'eu', 'uk')),
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  items JSONB DEFAULT '[]',
  ocr_processed BOOLEAN DEFAULT false,
  ocr_confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sf_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices" ON sf_invoices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- Cloud Sync: Settings
-- ==========================================
CREATE TABLE sf_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
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
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- Legacy: Licenses (deprecated, kept for backward compatibility)
-- ==========================================
-- CREATE TABLE licenses (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   key TEXT UNIQUE NOT NULL,
--   user_id UUID REFERENCES auth.users(id),
--   active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- Licenses table is deprecated. New users use subscriptions table.

-- ==========================================
-- OCR Usage Tracking
-- ==========================================
CREATE TABLE ocr_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ocr_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OCR usage" ON ocr_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OCR usage" ON ocr_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- Indexes for performance
-- ==========================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_sf_clients_user_id ON sf_clients(user_id);
CREATE INDEX idx_sf_invoices_user_id ON sf_invoices(user_id);
CREATE INDEX idx_sf_invoices_status ON sf_invoices(status);
CREATE INDEX idx_sf_settings_user_id ON sf_settings(user_id);
CREATE INDEX idx_ocr_usage_user_id ON ocr_usage(user_id);
CREATE INDEX idx_ocr_usage_created_at ON ocr_usage(created_at);
