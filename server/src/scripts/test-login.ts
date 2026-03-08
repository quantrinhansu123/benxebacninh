/**
 * Test Login Script
 * Tests login with provided credentials
 *
 * Usage: npm run test-login <email> <password>
 * Example: npm run test-login admin@benxe.com 123456
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../db/drizzle.js'
import { users } from '../db/schema/users.js'
import { sql } from 'drizzle-orm'

async function testLogin() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Vui lòng cung cấp email và password')
    console.log('Usage: npm run test-login <email> <password>')
    console.log('Example: npm run test-login admin@benxe.com 123456')
    process.exit(1)
  }

  if (!db) {
    console.error('❌ Database not initialized. Check DATABASE_URL in .env')
    process.exit(1)
  }

  try {
    const normalizedLogin = email.trim().toLowerCase()
    console.log(`🔍 Testing login for: ${normalizedLogin}\n`)

    // Step 1: Find user
    console.log(`1. Querying user WHERE lower(email) = '${normalizedLogin}'...`)
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedLogin}`)

    if (!user) {
      console.log('❌ User not found!')
      console.log('\n💡 Available users:')
      const allUsers = await db.select({ email: users.email }).from(users).limit(10)
      allUsers.forEach((u) => console.log(`   - ${u.email}`))
      process.exit(1)
    }

    console.log(`✅ User found: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   Has Password Hash: ${user.passwordHash ? 'Yes' : 'No'}\n`)

    // Step 2: Check if active
    if (!user.isActive) {
      console.log('❌ Account is disabled!')
      process.exit(1)
    }

    // Step 3: Check password hash
    if (!user.passwordHash) {
      console.log('❌ No password hash found!')
      console.log('\n💡 Reset password with:')
      console.log(`   npm run create-admin ${user.email} <new-password> "${user.name || 'User'}"`)
      process.exit(1)
    }

    // Step 4: Compare password
    console.log('2. Comparing password...')
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      console.log('❌ Password does not match!')
      console.log('\n💡 Reset password with:')
      console.log(`   npm run create-admin ${user.email} <new-password> "${user.name || 'User'}"`)
      process.exit(1)
    }

    console.log('✅ Password is valid!')
    console.log('\n✅ LOGIN SUCCESSFUL!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error testing login:', error)
    process.exit(1)
  }
}

testLogin()
