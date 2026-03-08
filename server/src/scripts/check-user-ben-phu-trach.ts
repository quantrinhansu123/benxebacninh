/**
 * Check User Ben Phu Trach Script
 * Shows all users with their assigned station (benPhuTrach)
 *
 * Usage: npm run check-user-ben-phu-trach
 */
import 'dotenv/config'
import { db } from '../db/drizzle.js'
import { users } from '../db/schema/users.js'
import { locations } from '../db/schema/locations.js'
import { eq } from 'drizzle-orm'

async function checkUserBenPhuTrach() {
  if (!db) {
    console.error('❌ Database not initialized. Check DATABASE_URL in .env')
    process.exit(1)
  }

  try {
    console.log('🔍 Đang tải danh sách users với thông tin bến phụ trách...\n')

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        benPhuTrach: users.benPhuTrach,
      })
      .from(users)
      .limit(100)

    if (allUsers.length === 0) {
      console.log('❌ Không có user nào trong database!')
      process.exit(1)
    }

    console.log(`✅ Tìm thấy ${allUsers.length} user(s):\n`)
    console.log('='.repeat(100))
    console.log(
      `${'Email'.padEnd(30)} ${'Name'.padEnd(25)} ${'Role'.padEnd(15)} ${'Active'.padEnd(10)} ${'Bến phụ trách'.padEnd(30)}`
    )
    console.log('='.repeat(100))

    for (const user of allUsers) {
      let benPhuTrachInfo = 'Không có'
      
      if (user.benPhuTrach) {
        const [location] = await db
          .select({ name: locations.name })
          .from(locations)
          .where(eq(locations.id, user.benPhuTrach))
          .limit(1)

        if (location) {
          benPhuTrachInfo = location.name
        } else {
          benPhuTrachInfo = `ID: ${user.benPhuTrach} (không tìm thấy)`
        }
      }

      const email = (user.email || '').padEnd(30)
      const name = (user.name || '(no name)').padEnd(25)
      const role = (user.role || 'user').padEnd(15)
      const active = (user.isActive ? 'Yes' : 'No').padEnd(10)
      const benPhuTrach = benPhuTrachInfo.padEnd(30)

      console.log(`${email} ${name} ${role} ${active} ${benPhuTrach}`)
    }

    console.log('='.repeat(100))
    console.log('\n💡 Để gán bến phụ trách cho user, sử dụng trang Quản lý nhân sự.')
    console.log('💡 Users có bến phụ trách sẽ chỉ thấy routes liên quan đến bến đó (trừ admin).')

    process.exit(0)
  } catch (error) {
    console.error('❌ Lỗi khi tải danh sách users:', error)
    process.exit(1)
  }
}

checkUserBenPhuTrach()
