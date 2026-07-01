-- OCR Usage Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ocr_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  image_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_ocr_usage_user ON ocr_usage(user_id);

-- RLS Policies (run separately if above fails)
-- ALTER TABLE ocr_usage ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own OCR usage" ON ocr_usage
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own OCR usage" ON ocr_usage
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
