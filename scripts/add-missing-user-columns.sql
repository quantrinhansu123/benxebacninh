-- Add missing columns to users table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

SELECT '✅ Missing columns added to users table' AS result;
