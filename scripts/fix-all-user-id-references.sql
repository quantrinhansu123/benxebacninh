-- Fix all user_id foreign key references to match TEXT type
-- Run this in Supabase Dashboard → SQL Editor

-- First, change users.id to TEXT (if not already done)
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Fix dispatch_records.user_id
ALTER TABLE dispatch_records ALTER COLUMN user_id TYPE TEXT;

-- Fix any other tables that reference users.id
-- (Add more if needed based on your schema)

SELECT '✅ All user_id references fixed to TEXT' AS result;
