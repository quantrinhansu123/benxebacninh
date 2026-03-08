/**
 * List Users Script
 * Lists all users in the database
 *
 * Usage: npm run list-users
 */
import 'dotenv/config'
import { db } from '../db/drizzle.js'
import { users } from '../db/schema/users.js'

async function listUsers() {
  if (!db) {
    console.error('❌ Database not initialized. Check DATABASE_URL in .env')
    process.exit(1)
  }

  try {
    console.log('🔍 Đang tải danh sách users...\n')

    const allUsers = await db.select().from(users).limit(100)

    if (allUsers.length === 0) {
      console.log('❌ Không có user nào trong database!')
      console.log('\n💡 Tạo user mới bằng lệnh:')
      console.log('   npm run create-admin <email> <password> "<name>"')
      console.log('\nVí dụ:')
      console.log('   npm run create-admin admin@benxe.local admin123 "Administrator"')
      process.exit(1)
    }

    console.log(`✅ Tìm thấy ${allUsers.length} user(s):\n`)
    console.log('='.repeat(80))
    console.log(
      `${'Email'.padEnd(30)} ${'Name'.padEnd(25)} ${'Role'.padEnd(15)} ${'Active'.padEnd(10)} ${'Has Password'.padEnd(15)}`
    )
    console.log('='.repeat(80))

    for (const user of allUsers) {
      const email = (user.email || '').padEnd(30)
      const name = (user.name || '(no name)').padEnd(25)
      const role = (user.role || 'user').padEnd(15)
      const active = (user.isActive ? 'Yes' : 'No').padEnd(10)
      const hasPassword = (user.passwordHash ? 'Yes' : 'No').padEnd(15)

      console.log(`${email} ${name} ${role} ${active} ${hasPassword}`)
    }

    console.log('='.repeat(80))
    console.log('\n💡 Để đăng nhập, sử dụng email và password đã được set.')
    console.log('💡 Để reset password, chạy: npm run create-admin <email> <new-password> "<name>"')

    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi khi tải danh sách users:', error)
    process.exit(1)
  }
}

listUsers()
