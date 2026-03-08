/**
 * Check User Script
 * Checks if a user exists and their password hash status
 *
 * Usage: npm run check-user [email]
 * Example: npm run check-user admin@example.com
 */
import 'dotenv/config'
import { db } from '../db/drizzle.js'
import { users } from '../db/schema/users.js'
import { eq, sql } from 'drizzle-orm'

async function checkUser() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npm run check-user <email>')
    process.exit(1)
  }

  if (!db) {
    console.error('❌ Database not initialized. Check DATABASE_URL in .env')
    process.exit(1)
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    console.log(`🔍 Checking user: ${normalizedEmail}\n`)

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)

    if (!user) {
      console.log('❌ User not found in database')
      console.log('\n💡 To create this user, run:')
      console.log(`   npm run create-admin ${email} <password> "<name>"`)
      process.exit(1)
    }

    console.log('✅ User found!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name || '(not set)'}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`)
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
    console.log(`   Password Hash: ${user.passwordHash ? '✅ Set' : '❌ NOT SET'}`)

    if (!user.passwordHash) {
      console.log('\n⚠️  WARNING: User has no password hash!')
      console.log('   This user cannot log in. To set a password, run:')
      console.log(`   npm run create-admin ${email} <password> "${user.name || 'User'}"`)
    } else if (!user.isActive) {
      console.log('\n⚠️  WARNING: User account is disabled!')
      console.log('   This user cannot log in even with correct password.')
    } else {
      console.log('\n✅ User account is ready for login')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error checking user:', error)
    process.exit(1)
  }
}

checkUser()
