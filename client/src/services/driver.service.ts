import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import { toast } from 'react-toastify'
import type { Driver, DriverInput } from '@/types'

// Cache for drivers
let driversCache: { data: Driver[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const driverService = {
  getAll: async (operatorId?: string, isActive?: boolean, forceRefresh = false): Promise<Driver[]> => {
    try {
      // Check cache (only for unfiltered queries)
      if (!forceRefresh && !operatorId && isActive === undefined && driversCache && Date.now() - driversCache.timestamp < CACHE_TTL) {
        return driversCache.data
      }

      let query = supabase.from('drivers').select('*')
      
      if (operatorId) {
        query = query.eq('operator_id', operatorId)
      }
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching drivers:', error)
        if (driversCache) return driversCache.data
        toast.error('Không thể tải danh sách lái xe. Vui lòng thử lại.')
        return []
      }

      const drivers = (data || []).map(toCamelCase) as Driver[]

      // Cache unfiltered results
      if (!operatorId && isActive === undefined) {
        driversCache = { data: drivers, timestamp: Date.now() }
      }

      return drivers
    } catch (error) {
      console.error('Error fetching drivers:', error)
      if (driversCache) return driversCache.data
      toast.error('Không thể tải danh sách lái xe. Vui lòng thử lại.')
      return []
    }
  },

  clearCache: () => {
    driversCache = null
  },

  getById: async (id: string): Promise<Driver> => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Driver not found')
    }
    
    return toCamelCase(data) as Driver
  },

  create: async (input: DriverInput): Promise<Driver> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('drivers')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create driver')
    }
    
    driverService.clearCache()
    return toCamelCase(data) as Driver
  },

  update: async (id: string, input: Partial<DriverInput>): Promise<Driver> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('drivers')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update driver')
    }
    
    driverService.clearCache()
    return toCamelCase(data) as Driver
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete driver')
    }
    
    driverService.clearCache()
  },
}
