/**
 * Supabase error handling utilities
 * Handles common Supabase errors including quota/payment issues
 */

export interface SupabaseError {
  code?: string
  message?: string
  status?: number
  details?: string
}

/**
 * Check if error is a payment/quota related error
 */
export function isPaymentRequiredError(error: any): boolean {
  if (!error) return false
  
  // Check status code
  if (error.status === 402 || error.code === '402') {
    return true
  }
  
  // Check error message
  const message = error.message?.toLowerCase() || ''
  if (
    message.includes('payment required') ||
    message.includes('exceed_egress_quota') ||
    message.includes('quota exceeded') ||
    message.includes('service is restricted')
  ) {
    return true
  }
  
  return false
}

/**
 * Get user-friendly error message
 */
export function getSupabaseErrorMessage(error: any): string {
  if (!error) {
    return 'Đã xảy ra lỗi không xác định'
  }
  
  // Payment/Quota errors
  if (isPaymentRequiredError(error)) {
    return 'Dịch vụ tạm thời không khả dụng do vượt quá hạn mức. Vui lòng liên hệ quản trị viên hoặc nâng cấp gói dịch vụ.'
  }
  
  // 401 Unauthorized
  if (error.status === 401 || error.code === '401' || error.code === 'PGRST301') {
    return 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
  }
  
  // 404 Not Found
  if (error.status === 404 || error.code === 'PGRST116') {
    return 'Không tìm thấy dữ liệu'
  }
  
  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.'
  }
  
  // Return original message or generic error
  return error.message || 'Đã xảy ra lỗi khi xử lý yêu cầu'
}

/**
 * Get error details for logging
 */
export function getErrorDetails(error: any): SupabaseError {
  return {
    code: error.code || error.status?.toString(),
    message: error.message,
    status: error.status,
    details: error.details || error.hint,
  }
}
