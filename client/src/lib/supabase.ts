import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Fallback values for development (replace with your actual Supabase project credentials)
// TODO: Remove fallback and use .env file in production
// NEW Supabase project (after migration)
const fallbackUrl = 'https://ofdpkojsuuydkhyoeywj.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHBrb2pzdXV5ZGtoeW9leXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk2NjcsImV4cCI6MjA4NTYxNTY2N30.g37sDeK0IsiP6db8Lffh7jIUA76TqN6cvLLMs9YFvAQ'

// Use fallback if env vars are not set (development only)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found in .env file')
  console.warn('⚠️ Using fallback values. Please create client/.env with:')
  console.warn('   VITE_SUPABASE_URL=https://your-project.supabase.co')
  console.warn('   VITE_SUPABASE_ANON_KEY=your-anon-key-here')
  console.warn('⚠️ Get credentials from Supabase Dashboard: Settings → API')
  
  supabaseUrl = supabaseUrl || fallbackUrl
  supabaseAnonKey = supabaseAnonKey || fallbackKey
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in client/.env')
}

// Validate key format (basic check)
if (supabaseAnonKey && supabaseAnonKey.length < 20) {
  console.error('❌ Invalid Supabase API key format. Key seems too short.')
  console.error('📖 Please check your Supabase Dashboard: Settings → API → Project API keys → anon/public key')
}

// Create Supabase client with error handling
let supabase: ReturnType<typeof createClient>

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  
  // Test connection (optional - can be removed in production)
  if (import.meta.env.DEV) {
    supabase.from('users').select('id').limit(1).then(({ error }) => {
      if (error && error.message?.includes('Invalid API key')) {
        console.error('❌ Invalid Supabase API key!')
        console.error('📖 Please update VITE_SUPABASE_ANON_KEY in client/.env')
        console.error('📖 Get the correct key from Supabase Dashboard: Settings → API')
        console.error('🔗 Dashboard: https://supabase.com/dashboard/project/_/settings/api')
      }
    }).catch(() => {
      // Ignore connection test errors
    })
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error)
  throw new Error('Failed to initialize Supabase. Please check your API credentials.')
}

export { supabase }
