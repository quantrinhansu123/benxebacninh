/**
 * @deprecated Backend API client - DEPRECATED
 * Đã chuyển sang Supabase trực tiếp
 * File này chỉ giữ lại để backward compatibility
 * Không nên sử dụng mới, hãy dùng Supabase client thay thế
 * 
 * ⚠️ WARNING: Backend API is no longer used. All services have been migrated to Supabase.
 * This file will throw errors if used. Please update your code to use Supabase directly.
 */
import axios, { AxiosError, AxiosInstance } from 'axios'

// Disable backend API - throw error if anyone tries to use it
const throwDeprecatedError = (method: string, url: string) => {
  console.error(`❌ DEPRECATED: ${method.toUpperCase()} ${url}`)
  console.error('⚠️ Backend API is no longer used. Please migrate to Supabase.')
  throw new Error(
    `Backend API is deprecated. ${method.toUpperCase()} ${url} is not available. ` +
    'Please use Supabase client instead. See client/src/lib/supabase.ts'
  )
}

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercept all requests and throw error
api.interceptors.request.use(
  (config) => {
    // Allow only if explicitly bypassed (for migration purposes)
    if (config.headers?.['X-Allow-Deprecated-API'] === 'true') {
      return config
    }
    
    // Block all requests to backend API
    throwDeprecatedError(config.method || 'GET', config.url || '')
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login'
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      
      // Don't clear token or redirect if this is a login request (let login page handle the error)
      if (!isLoginRequest) {
        // Handle unauthorized - clear token
        localStorage.removeItem('auth_token')
        
        // Show user-friendly message
        const responseData = error.response?.data as { error?: string; code?: string } | undefined
        if (responseData?.code === 'TOKEN_EXPIRED') {
          console.warn('Token đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.')
        }
        
        // Only redirect if not already on login page
        if (!isLoginPage) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

