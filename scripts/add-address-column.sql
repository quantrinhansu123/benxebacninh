-- Add address column to users table if it doesn't exist
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);

SELECT '✅ Address column added to users table' AS result;
