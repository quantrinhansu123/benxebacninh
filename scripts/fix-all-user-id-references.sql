-- Fix all user_id foreign key references to match TEXT type
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Drop foreign key constraints first
ALTER TABLE dispatch_records DROP CONSTRAINT IF EXISTS dispatch_records_user_id_users_id_fk;
ALTER TABLE dispatch_records DROP CONSTRAINT IF EXISTS dispatch_records_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Step 2: Change users.id to TEXT (if not already done)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid') THEN
    ALTER TABLE users ALTER COLUMN id TYPE TEXT;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
    ALTER TABLE users ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Step 3: Change user_id columns to TEXT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'user_id' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN user_id TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'uuid') THEN
    ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Step 4: Re-add foreign key constraints
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

SELECT '✅ All user_id references fixed to TEXT' AS result;
