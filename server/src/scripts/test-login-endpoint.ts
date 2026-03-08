/**
 * Test Login Endpoint Script
 * Tests the login endpoint directly via HTTP
 *
 * Usage: npm run test-login-endpoint [email] [password]
 * Example: npm run test-login-endpoint admin@benxe.com 123456
 */
import 'dotenv/config'

const email = process.argv[2] || 'admin@benxe.com'
const password = process.argv[3] || '123456'
const baseUrl = process.env.TEST_URL || 'http://localhost:3000'

async function testLoginEndpoint() {
  console.log('🧪 Testing login endpoint...\n')
  console.log(`URL: ${baseUrl}/api/auth/login`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${'*'.repeat(password.length)}\n`)

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernameOrEmail: email,
        password: password,
      }),
    })

    const data = await response.json()

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Response:`, JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Login successful!')
      if (data.token) {
        console.log(`Token: ${data.token.substring(0, 20)}...`)
      }
    } else {
      console.log('\n❌ Login failed!')
      console.log(`Error: ${data.error || 'Unknown error'}`)
      if (data.details) {
        console.log(`Details:`, data.details)
      }
    }

    process.exit(response.ok ? 0 : 1)
  } catch (error) {
    console.error('❌ Request failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Server might not be running. Start it with: npm run dev')
      }
    }
    process.exit(1)
  }
}

testLoginEndpoint()
