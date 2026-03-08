/**
 * Environment Variables Checker
 * Validates all required environment variables are set
 *
 * Usage: npm run check-env
 */
import 'dotenv/config'

interface EnvVar {
  name: string
  required: boolean
  description: string
  validator?: (value: string) => boolean | string
}

const envVars: EnvVar[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string (Supabase)',
    validator: (value) => {
      if (!value.includes('postgres://') && !value.includes('postgresql://')) {
        return 'Must be a PostgreSQL connection string'
      }
      return true
    },
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret key for JWT token signing',
    validator: (value) => {
      if (value.length < 32) {
        return 'Should be at least 32 characters for security'
      }
      return true
    },
  },
  {
    name: 'APP_PORT',
    required: false,
    description: 'Server port (defaults to 3000)',
    validator: (value) => {
      const port = parseInt(value, 10)
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'Must be a valid port number (1-65535)'
      }
      return true
    },
  },
  {
    name: 'JWT_EXPIRES_IN',
    required: false,
    description: 'JWT token expiration (defaults to 7d)',
  },
  {
    name: 'CORS_ORIGIN',
    required: false,
    description: 'CORS allowed origin (defaults to http://localhost:5173)',
  },
  {
    name: 'SUPABASE_URL',
    required: false,
    description: 'Supabase project URL (for file storage)',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service role key (for file storage)',
  },
  {
    name: 'GEMINI_API_KEY',
    required: false,
    description: 'Google Gemini API key (for AI chat features)',
  },
  {
    name: 'GPS_ENCRYPTION_KEY',
    required: false,
    description: '64-character hex key for GPS password encryption',
    validator: (value) => {
      if (value && value.length !== 64) {
        return 'Must be exactly 64 hexadecimal characters'
      }
      if (value && !/^[0-9a-fA-F]+$/.test(value)) {
        return 'Must contain only hexadecimal characters (0-9, a-f)'
      }
      return true
    },
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Environment mode (development/production)',
  },
]

function checkEnvironment(): void {
  console.log('🔍 Kiểm tra biến môi trường...\n')

  let hasErrors = false
  let hasWarnings = false

  for (const envVar of envVars) {
    const value = process.env[envVar.name]
    const isSet = value !== undefined && value !== ''

    if (!isSet) {
      if (envVar.required) {
        console.log(`❌ ${envVar.name}: THIẾU (BẮT BUỘC)`)
        console.log(`   ${envVar.description}\n`)
        hasErrors = true
      } else {
        console.log(`⚠️  ${envVar.name}: Chưa đặt (Tùy chọn)`)
        console.log(`   ${envVar.description}`)
        if (envVar.name === 'SUPABASE_URL' || envVar.name === 'SUPABASE_SERVICE_ROLE_KEY') {
          console.log(`   ⚠️  Lưu ý: Tính năng upload file sẽ không hoạt động\n`)
          hasWarnings = true
        } else {
          console.log('')
        }
      }
    } else {
      // Validate if validator exists
      if (envVar.validator) {
        const validation = envVar.validator(value)
        if (validation === true) {
          // Mask sensitive values
          const displayValue =
            envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('PASSWORD')
              ? '***' + value.slice(-4)
              : value.length > 50
                ? value.substring(0, 50) + '...'
                : value
          console.log(`✅ ${envVar.name}: ${displayValue}`)
        } else {
          console.log(`⚠️  ${envVar.name}: ${value.substring(0, 20)}...`)
          console.log(`   ⚠️  Cảnh báo: ${validation}\n`)
          hasWarnings = true
        }
      } else {
        // Mask sensitive values
        const displayValue =
          envVar.name.includes('SECRET') || envVar.name.includes('KEY') || envVar.name.includes('PASSWORD')
            ? '***' + value.slice(-4)
            : value.length > 50
              ? value.substring(0, 50) + '...'
              : value
        console.log(`✅ ${envVar.name}: ${displayValue}`)
      }
      console.log(`   ${envVar.description}\n`)
    }
  }

  console.log('\n' + '='.repeat(60))
  if (hasErrors) {
    console.log('\n❌ CÓ LỖI: Một số biến môi trường bắt buộc bị thiếu!')
    console.log('\n💡 Hướng dẫn:')
    console.log('   1. Tạo file .env trong thư mục server/')
    console.log('   2. Thêm các biến môi trường bắt buộc:')
    console.log('      DATABASE_URL=postgresql://...')
    console.log('      JWT_SECRET=your-secret-key-here')
    console.log('   3. Chạy lại: npm run check-env')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('\n⚠️  CẢNH BÁO: Một số biến môi trường có vấn đề hoặc chưa đặt')
    console.log('   Server có thể chạy nhưng một số tính năng có thể không hoạt động')
    process.exit(0)
  } else {
    console.log('\n✅ TẤT CẢ BIẾN MÔI TRƯỜNG ĐỀU HỢP LỆ!')
    process.exit(0)
  }
}

checkEnvironment()
