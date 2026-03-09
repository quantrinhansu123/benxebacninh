-- Fix all user foreign key references to match TEXT type
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Drop ALL foreign key constraints that reference users.id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%user%'
    AND table_schema = 'public'
  ) LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

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

-- Step 3: Change ALL user reference columns to TEXT in dispatch_records
DO $$
BEGIN
  -- List of all columns in dispatch_records that reference users
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'user_id' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN user_id TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'entry_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN entry_by TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'passenger_drop_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN passenger_drop_by TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'boarding_permit_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN boarding_permit_by TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'payment_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN payment_by TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'departure_order_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN departure_order_by TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dispatch_records' AND column_name = 'exit_by' AND data_type = 'uuid') THEN
    ALTER TABLE dispatch_records ALTER COLUMN exit_by TYPE TEXT;
  END IF;
END $$;

-- Step 4: Change user_id in audit_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'audit_logs' AND column_name = 'user_id' AND data_type = 'uuid') THEN
    ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT;
  END IF;
END $$;

-- Step 5: Re-add foreign key constraints
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_entry_by_fkey 
  FOREIGN KEY (entry_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_passenger_drop_by_fkey 
  FOREIGN KEY (passenger_drop_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_boarding_permit_by_fkey 
  FOREIGN KEY (boarding_permit_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_payment_by_fkey 
  FOREIGN KEY (payment_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_departure_order_by_fkey 
  FOREIGN KEY (departure_order_by) REFERENCES users(id);
ALTER TABLE dispatch_records ADD CONSTRAINT dispatch_records_exit_by_fkey 
  FOREIGN KEY (exit_by) REFERENCES users(id);
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id);

SELECT '✅ All user references fixed to TEXT' AS result;
