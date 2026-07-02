-- TaxFlow Subscription System Migration
-- Date: 2026-07-02
-- Purpose: Replace licenses-based check with proper subscription lifecycle

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paypal_subscription_id TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'active',        -- Normal subscription in good standing
    'canceled',      -- User canceled, still usable until period end
    'past_due',      -- Payment failed, in grace period (~7 days)
    'expired',       -- No longer usable
    'pending'        -- Awaiting first payment confirmation
  )),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert/update (for webhook)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role
  USING (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Migrate existing PayPal subscriptions from licenses table
-- (Run this after verifying the new table works)
-- INSERT INTO subscriptions (user_id, paypal_subscription_id, plan_type, status, created_at)
-- SELECT user_id, REPLACE(key, 'PAYPAL-SUB-', ''), 'monthly', 'active', created_at
-- FROM licenses
-- WHERE key LIKE 'PAYPAL-SUB-%' AND active = true
-- ON CONFLICT (paypal_subscription_id) DO NOTHING;
