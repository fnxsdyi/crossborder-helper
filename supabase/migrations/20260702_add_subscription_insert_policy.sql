-- Allow authenticated users to insert their own subscriptions
-- This is needed for PremiumGate and OcrUsageLimit to create subscription records after PayPal payment

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
