CREATE TABLE ocr_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  image_hash TEXT
);
