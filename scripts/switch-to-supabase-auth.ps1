# PowerShell script to switch from custom auth to Supabase Auth

Write-Host "🔄 Switching to Supabase Auth..." -ForegroundColor Cyan

# Backup current authApi
if (Test-Path "client/src/features/auth/api/authApi.ts") {
  Copy-Item "client/src/features/auth/api/authApi.ts" "client/src/features/auth/api/authApi.custom-backup.ts"
  Write-Host "✅ Backed up current authApi to authApi.custom-backup.ts" -ForegroundColor Green
}

# Replace with Supabase Auth version
if (Test-Path "client/src/features/auth/api/authApi.supabase-auth.ts") {
  Copy-Item "client/src/features/auth/api/authApi.supabase-auth.ts" "client/src/features/auth/api/authApi.ts" -Force
  Write-Host "✅ Switched to Supabase Auth" -ForegroundColor Green
} else {
  Write-Host "❌ authApi.supabase-auth.ts not found" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✅ Done! Next steps:" -ForegroundColor Green
Write-Host "1. Enable Email provider in Supabase Dashboard → Authentication → Providers"
Write-Host "2. Test login with a new user"
Write-Host "3. Migrate existing users (see MIGRATE_TO_SUPABASE_AUTH.md)"
Write-Host ""
Write-Host "To rollback: Copy-Item client/src/features/auth/api/authApi.custom-backup.ts client/src/features/auth/api/authApi.ts -Force" -ForegroundColor Yellow
