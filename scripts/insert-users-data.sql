-- Insert users data into new Supabase
-- Run this in Supabase Dashboard → SQL Editor

-- Clear existing users (optional - comment out if you want to keep existing)
-- DELETE FROM users;

-- Insert users data
INSERT INTO "public"."users" 
  ("id", "firebase_id", "email", "password_hash", "name", "phone", "role", "is_active", "email_verified", "last_login_at", "metadata", "created_at", "updated_at", "ben_phu_trach") 
VALUES 
  ('579832fc-3df1-4100-85b4-a4e6622635c7', null, 'upedu2024@gmail.com', '123456', 'Admin', null, 'admin', true, true, null, null, '2026-01-11 04:51:38.931069+00', '2026-03-08 23:36:32.641+00', null),
  ('6d6ad516-b740-4438-b4ad-e5f7f9461f5c', null, 'admin@benxe.local', '$2a$10$fnGQAv4DbGqhCNClvNM59e2xbKRvPN6vK5ucGhtRShNP7N27hlFA6', 'Administrator', null, 'admin', true, true, null, null, '2026-03-05 09:02:33.597121+00', '2026-03-05 09:02:33.597121+00', null),
  ('f5285c83-ca40-46c8-9ed3-1fca8632b136', null, 'benxehiephoa@gmail.com', '$2a$10$Q02gMHsB3X598KMbr.p3J.iyRUIndZSpyY8T0pdeyPRPZ.QbxNm/m', 'Bến xe Hiệp Hoà', '0965310233', 'user', true, false, null, null, '2026-03-08 23:54:16.96164+00', '2026-03-08 23:54:16.96164+00', 'ac1b1f44-53c8-4cbd-b151-290ec6132089')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  last_login_at = EXCLUDED.last_login_at,
  metadata = EXCLUDED.metadata,
  updated_at = EXCLUDED.updated_at,
  ben_phu_trach = EXCLUDED.ben_phu_trach;

SELECT '✅ Users data inserted successfully!' AS result;
SELECT COUNT(*) as total_users FROM users;
