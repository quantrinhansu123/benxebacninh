/**
 * Utility functions for Supabase operations
 */

// Helper to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (obj instanceof Date) return obj
  
  const camelObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      camelObj[camelKey] = toCamelCase(obj[key])
    }
  }
  return camelObj
}

// Helper to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (obj instanceof Date) return obj
  
  const snakeObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      snakeObj[snakeKey] = toSnakeCase(obj[key])
    }
  }
  return snakeObj
}
