#!/bin/bash
# Script to switch from custom auth to Supabase Auth

echo "🔄 Switching to Supabase Auth..."

# Backup current authApi
if [ -f "client/src/features/auth/api/authApi.ts" ]; then
  cp client/src/features/auth/api/authApi.ts client/src/features/auth/api/authApi.custom-backup.ts
  echo "✅ Backed up current authApi to authApi.custom-backup.ts"
fi

# Replace with Supabase Auth version
if [ -f "client/src/features/auth/api/authApi.supabase-auth.ts" ]; then
  cp client/src/features/auth/api/authApi.supabase-auth.ts client/src/features/auth/api/authApi.ts
  echo "✅ Switched to Supabase Auth"
else
  echo "❌ authApi.supabase-auth.ts not found"
  exit 1
fi

echo ""
echo "✅ Done! Next steps:"
echo "1. Enable Email provider in Supabase Dashboard → Authentication → Providers"
echo "2. Test login with a new user"
echo "3. Migrate existing users (see MIGRATE_TO_SUPABASE_AUTH.md)"
echo ""
echo "To rollback: cp client/src/features/auth/api/authApi.custom-backup.ts client/src/features/auth/api/authApi.ts"
