-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Create licenses table
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read licenses
CREATE POLICY "Users can view licenses" ON licenses
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to update their own license
CREATE POLICY "Users can update own license" ON licenses
  FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- Insert some test license keys (change these to your actual keys)
INSERT INTO licenses (key) VALUES
  ('CB-TEST-0001'),
  ('CB-TEST-0002'),
  ('CB-TEST-0003');
