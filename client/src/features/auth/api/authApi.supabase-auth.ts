/**
 * Supabase Auth-based Authentication
 * Uses Supabase built-in authentication instead of custom password hashing
 * 
 * Benefits:
 * - Automatic session management
 * - Token refresh
 * - Better security
 * - No need to manage password hashes manually
 */

import { supabase } from '@/lib/supabase'
import { isPaymentRequiredError, getSupabaseErrorMessage } from '@/lib/supabase-error-handler'
import type { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const email = credentials.usernameOrEmail.trim().toLowerCase()
      const password = credentials.password

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc')
      }

      // Use Supabase Auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Check for payment/quota errors
        if (isPaymentRequiredError(authError)) {
          const errorMsg = getSupabaseErrorMessage(authError)
          console.error('🚨 Supabase Payment Required Error:', errorMsg)
          throw new Error('Dịch vụ tạm thời không khả dụng do vượt quá hạn mức. Vui lòng liên hệ quản trị viên hoặc nâng cấp gói dịch vụ Supabase.')
        }

        // Handle common auth errors
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email và mật khẩu.')
        }
        
        if (authError.message?.includes('Email not confirmed')) {
          throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư email.')
        }

        throw new Error(authError.message || 'Đăng nhập thất bại')
      }

      if (!authData.user) {
        throw new Error('Đăng nhập thất bại')
      }

      // Get user profile from users table (for role, name, etc.)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, phone, is_active')
        .eq('id', authData.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('⚠️ Could not fetch user profile:', profileError.message)
      }

      // Check if user is active (if profile exists)
      if (userProfile && !userProfile.is_active) {
        // Sign out if account is inactive
        await supabase.auth.signOut()
        throw new Error('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.')
      }

      // Map to app User type
      const user: User = {
        id: authData.user.id,
        username: email.split('@')[0],
        fullName: userProfile?.name || authData.user.user_metadata?.full_name || email,
        role: (userProfile?.role as User['role']) || authData.user.user_metadata?.role || 'reporter',
        email: authData.user.email || email,
        phone: userProfile?.phone || authData.user.user_metadata?.phone || undefined,
      }

      // Supabase Auth automatically manages the session
      // Access token is stored in supabase.auth.session()
      const token = authData.session?.access_token || authData.user.id

      return {
        token,
        user,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Đăng nhập thất bại')
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const email = credentials.email || `${credentials.username}@example.com`
      const password = credentials.password

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc')
      }

      // Use Supabase Auth to sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: credentials.fullName || credentials.username,
            role: credentials.role || 'reporter',
          },
        },
      })

      if (authError) {
        if (isPaymentRequiredError(authError)) {
          throw new Error('Dịch vụ tạm thời không khả dụng do vượt quá hạn mức. Vui lòng liên hệ quản trị viên.')
        }

        if (authError.message?.includes('User already registered')) {
          throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.')
        }

        throw new Error(authError.message || 'Đăng ký thất bại')
      }

      if (!authData.user) {
        throw new Error('Đăng ký thất bại')
      }

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name: credentials.fullName || credentials.username,
          role: credentials.role || 'reporter',
          phone: credentials.phone,
          is_active: true,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })

      if (profileError) {
        console.warn('⚠️ Could not create user profile:', profileError.message)
      }

      // Map to app User type
      const user: User = {
        id: authData.user.id,
        username: credentials.username || email.split('@')[0],
        fullName: credentials.fullName || credentials.username,
        role: (credentials.role as User['role']) || 'reporter',
        email: authData.user.email || email,
        phone: credentials.phone,
      }

      const token = authData.session?.access_token || authData.user.id

      return {
        token,
        user,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Đăng ký thất bại')
    }
  },

  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('auth_token')
    } catch (error) {
      console.error('Error logging out:', error)
      // Still clear local storage
      localStorage.removeItem('auth_token')
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Get current session from Supabase Auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        return null
      }

      // Get user profile from users table
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, email, name, role, phone, is_active')
        .eq('id', session.user.id)
        .single()

      if (!userProfile) {
        // Fallback to auth user metadata
        return {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          fullName: session.user.user_metadata?.full_name || session.user.email || 'User',
          role: (session.user.user_metadata?.role as User['role']) || 'reporter',
          email: session.user.email || '',
          phone: session.user.user_metadata?.phone,
        }
      }

      if (!userProfile.is_active) {
        await supabase.auth.signOut()
        return null
      }

      return {
        id: userProfile.id,
        username: userProfile.email?.split('@')[0] || 'user',
        fullName: userProfile.name || userProfile.email || 'User',
        role: (userProfile.role as User['role']) || 'reporter',
        email: userProfile.email || '',
        phone: userProfile.phone || undefined,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  updateProfile: async (data: { fullName?: string; email?: string; phone?: string }): Promise<User> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        throw new Error('Không tìm thấy phiên đăng nhập')
      }

      // Update in users table
      const updateData: any = {}
      if (data.fullName) updateData.name = data.fullName
      if (data.email) updateData.email = data.email
      if (data.phone !== undefined) updateData.phone = data.phone

      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message || 'Cập nhật thông tin thất bại')
      }

      // Update auth user metadata
      if (data.fullName || data.phone) {
        await supabase.auth.updateUser({
          data: {
            full_name: data.fullName || updatedProfile.name,
            phone: data.phone || updatedProfile.phone,
          },
        })
      }

      return {
        id: updatedProfile.id,
        username: updatedProfile.email?.split('@')[0] || 'user',
        fullName: updatedProfile.name || updatedProfile.email || 'User',
        role: (updatedProfile.role as User['role']) || 'reporter',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || undefined,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Cập nhật thông tin thất bại')
    }
  },

  isAuthenticated: (): boolean => {
    // Check Supabase session
    const { data: { session } } = supabase.auth.getSession()
    return !!session
  },
}
