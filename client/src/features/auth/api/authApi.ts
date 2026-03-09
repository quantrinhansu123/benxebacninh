import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import type { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Clear any old/invalid token before login attempt
      localStorage.removeItem('auth_token')
      
      const email = credentials.usernameOrEmail.trim().toLowerCase()
      const password = credentials.password

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc')
      }

      // Query user directly from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, phone, is_active, password_hash')
        .eq('email', email)
        .single()

      if (userError) {
        // PGRST116 is specific for 0 rows in .single()
        if (userError.code === 'PGRST116') {
          throw new Error('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email và mật khẩu.')
        }
        throw new Error(userError.message || 'Không thể kết nối đến database')
      }

      if (!userData) {
        throw new Error('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email và mật khẩu.')
      }

      // Check if user is active
      if (!userData.is_active) {
        throw new Error('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.')
      }

      // Check if user has password
      if (!userData.password_hash) {
        throw new Error('Tài khoản chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.')
      }

      // Compare password with bcrypt
      const passwordMatch = bcrypt.compareSync(password, userData.password_hash)

      if (!passwordMatch) {
        throw new Error('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email và mật khẩu.')
      }

      // Map Supabase user to app User type
      const user: User = {
        id: userData.id,
        username: email.split('@')[0],
        fullName: userData.name || email,
        role: (userData.role as User['role']) || 'reporter',
        email: userData.email || email,
        phone: userData.phone || undefined,
      }

      // Generate a simple token (or use user ID as token for now)
      // In production, you might want to generate a JWT token
      const token = userData.id

      // Store token
      localStorage.setItem('auth_token', token)

      return {
        token,
        user,
      }
    } catch (error) {
      // Clear token on login failure
      localStorage.removeItem('auth_token')
      
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

      // Hash password with bcrypt
      const passwordHash = bcrypt.hashSync(password, 10)

      // Create user in users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          name: credentials.fullName,
          phone: credentials.phone,
          role: credentials.role || 'reporter',
          password_hash: passwordHash,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation (email already exists)
          throw new Error('Email đã được sử dụng. Vui lòng chọn email khác.')
        }
        throw new Error(insertError.message || 'Đăng ký thất bại')
      }

      if (!newUser) {
        throw new Error('Đăng ký thất bại. Không nhận được dữ liệu từ server.')
      }

      // Map to app User type
      const user: User = {
        id: newUser.id,
        username: credentials.username,
        fullName: credentials.fullName,
        role: (newUser.role as User['role']) || 'reporter',
        email: newUser.email || email,
        phone: newUser.phone || credentials.phone,
      }

      // Store token (use user ID as token)
      const token = newUser.id
      localStorage.setItem('auth_token', token)

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
    localStorage.removeItem('auth_token')
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Không tìm thấy thông tin đăng nhập')
      }

      // Query user by ID (token is user ID)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, phone, is_active')
        .eq('id', token)
        .single()

      if (profileError || !userProfile) {
        throw new Error('Không tìm thấy thông tin người dùng')
      }

      // Check if user is active
      if (!userProfile.is_active) {
        localStorage.removeItem('auth_token')
        throw new Error('Tài khoản đã bị vô hiệu hóa')
      }

      // Map Supabase user to app User type
      const user: User = {
        id: userProfile.id,
        username: (userProfile.email || '').split('@')[0],
        fullName: userProfile.name || userProfile.email || 'User',
        role: (userProfile.role as User['role']) || 'reporter',
        email: userProfile.email,
        phone: userProfile.phone || undefined,
      }

      return user
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Không thể lấy thông tin người dùng')
    }
  },

  updateProfile: async (data: { fullName?: string; email?: string; phone?: string }): Promise<User> => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Không tìm thấy thông tin đăng nhập')
      }

      // Update user profile in users table
      const updateData: Record<string, unknown> = {}
      if (data.fullName) updateData.name = data.fullName
      if (data.email) updateData.email = data.email.toLowerCase()
      if (data.phone) updateData.phone = data.phone

      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', token)
        .select()
        .single()

      if (updateError) {
        throw new Error(updateError.message || 'Cập nhật thông tin thất bại')
      }

      if (!updatedProfile) {
        throw new Error('Không tìm thấy thông tin người dùng')
      }

      // Map to app User type
      const user: User = {
        id: updatedProfile.id,
        username: (updatedProfile.email || '').split('@')[0],
        fullName: updatedProfile.name || data.fullName || updatedProfile.email || 'User',
        role: (updatedProfile.role as User['role']) || 'reporter',
        email: updatedProfile.email,
        phone: updatedProfile.phone || data.phone,
      }

      return user
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Cập nhật thông tin thất bại')
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token')
  },
}

// Backward compatibility
export default authApi
