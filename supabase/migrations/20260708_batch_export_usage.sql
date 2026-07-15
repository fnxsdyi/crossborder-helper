-- Create batch_export_usage table for tracking free PDF batch export usage
CREATE TABLE IF NOT EXISTS batch_export_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient monthly queries
CREATE INDEX IF NOT EXISTS idx_batch_export_usage_user_id_created_at
  ON batch_export_usage(user_id, created_at);

-- Enable RLS
ALTER TABLE batch_export_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own batch export usage"
  ON batch_export_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own batch export usage"
  ON batch_export_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
