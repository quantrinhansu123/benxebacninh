/**
 * Test Webhook Script
 * Test webhook endpoint với sample data
 * 
 * Usage: npx tsx server/src/scripts/test-webhook.ts
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/appsheet/badges'
const WEBHOOK_SECRET = process.env.APPSHEET_WEBHOOK_SECRET || '52dbeb9e92fd4fe8f6ee4189919cfeb700d56506350e4ff679b6e3562901e2e1'

const testBadge = {
  id: `test_${Date.now()}`,
  badgeNumber: `TEST-${Date.now().toString().slice(-6)}`,
  plateNumber: '99H01234',
  badgeType: 'Buýt',
  status: 'active',
  issueDate: '2024-01-01',
  expiryDate: '2025-12-31',
}

async function testWebhook() {
  console.log('🧪 Testing Webhook...')
  console.log(`📍 URL: ${WEBHOOK_URL}`)
  console.log(`🔑 Secret: ${WEBHOOK_SECRET.substring(0, 20)}...`)
  console.log('')

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AppSheet-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        badges: [testBadge],
      }),
    })

    const data = await response.json()

    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`📦 Response:`, JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('✅ Webhook test successful!')
      console.log(`   Badge created: ${testBadge.badgeNumber}`)
    } else {
      console.error('❌ Webhook test failed!')
      console.error(`   Error: ${data.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error)
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`)
    }
    console.error('')
    console.error('💡 Make sure:')
    console.error('   1. Server is running (npm run dev)')
    console.error('   2. URL is correct')
    console.error('   3. Network is accessible')
  }
}

testWebhook()
