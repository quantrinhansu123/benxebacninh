import { create } from 'zustand'
import type { User, RegisterCredentials } from '../types'
import { authApi } from '../api/authApi'

interface AuthStoreState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (data: { fullName?: string; email?: string; phone?: string }) => Promise<void>
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (usernameOrEmail: string, password: string, rememberMe = false) => {
    try {
      const data = await authApi.login({ usernameOrEmail, password, rememberMe })
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (credentials: RegisterCredentials) => {
    try {
      const data = await authApi.register(credentials)
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
      set({ user: null, isAuthenticated: false })
    } catch (error) {
      console.error('Error logging out:', error)
      // Still clear local state even if logout fails
      set({ user: null, isAuthenticated: false })
    }
  },

  checkAuth: async () => {
    try {
      const authenticated = authApi.isAuthenticated()
      if (authenticated) {
        const user = await authApi.getCurrentUser()
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateProfile: async (data: { fullName?: string; email?: string; phone?: string }) => {
    try {
      const updatedUser = await authApi.updateProfile(data)
      set({ user: updatedUser })
    } catch (error) {
      throw error
    }
  },
}))
