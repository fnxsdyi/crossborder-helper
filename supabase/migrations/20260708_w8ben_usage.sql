-- Create w8ben_usage table for tracking free W-8BEN form generation usage
CREATE TABLE IF NOT EXISTS w8ben_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient monthly queries
CREATE INDEX IF NOT EXISTS idx_w8ben_usage_user_id_created_at
  ON w8ben_usage(user_id, created_at);

-- Enable RLS
ALTER TABLE w8ben_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own W8BEN usage"
  ON w8ben_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own W8BEN usage"
  ON w8ben_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
