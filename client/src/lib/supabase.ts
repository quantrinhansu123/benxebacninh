import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Fallback values for development (replace with your actual Supabase project credentials)
// TODO: Remove fallback and use .env file in production
const fallbackUrl = 'https://gsjhsmxyxjyiqovauyrp.supabase.co'
const fallbackKey = 'sb_publishable_vXBSa3eP8cvjIK2qLWI6Ug_FoYm4CNy'

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
