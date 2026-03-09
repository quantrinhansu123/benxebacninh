import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import { supabaseCache, getCacheKey } from '@/lib/supabase-cache'
import type { Vehicle, VehicleInput } from '@/types'

// Essential fields only to reduce bandwidth
const VEHICLE_ESSENTIAL_FIELDS = 'id,plate_number,operator_id,operator_name,seat_count,vehicle_type_id,is_active,created_at,updated_at'

export const vehicleService = {
  getAll: async (operatorId?: string, isActive?: boolean, includeLegacy?: boolean, forceRefresh = false): Promise<Vehicle[]> => {
    try {
      const cacheKey = getCacheKey('vehicles', { operatorId, isActive, includeLegacy })
      
      // Check cache first (5 min TTL)
      if (!forceRefresh) {
        const cached = supabaseCache.get<Vehicle[]>(cacheKey)
        if (cached) {
          return cached
        }
      }
      
      let query = supabase.from('vehicles').select(VEHICLE_ESSENTIAL_FIELDS)
      
      if (operatorId) {
        query = query.eq('operator_id', operatorId)
      }
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1000) // Limit to prevent huge queries
      
      if (error) {
        console.error('Error fetching vehicles:', error)
        return []
      }
      
      const result = (data || []).map(toCamelCase) as Vehicle[]
      
      // Cache result
      supabaseCache.set(cacheKey, result, 5 * 60 * 1000) // 5 minutes
      
      return result
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      return []
    }
  },

  getById: async (id: string): Promise<Vehicle> => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Vehicle not found')
    }
    
    return toCamelCase(data) as Vehicle
  },

  create: async (input: VehicleInput): Promise<Vehicle> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('vehicles')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create vehicle')
    }
    
    return toCamelCase(data) as Vehicle
  },

  update: async (id: string, input: Partial<VehicleInput>): Promise<Vehicle> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('vehicles')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update vehicle')
    }
    
    return toCamelCase(data) as Vehicle
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete vehicle')
    }
  },

  getDocumentAuditLogs: async (vehicleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching vehicle document audit logs:', error)
        return []
      }
      
      return (data || []).map(toCamelCase)
    } catch (error) {
      console.error('Error fetching vehicle document audit logs:', error)
      return []
    }
  },

  // Get all document audit logs for all vehicles (optimized)
  getAllDocumentAuditLogs: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching all document audit logs:', error)
        return []
      }
      
      return (data || []).map(toCamelCase)
    } catch (error) {
      console.error('Error fetching all document audit logs:', error)
      return []
    }
  },

  /**
   * Lookup vehicle by plate
   * Returns seat capacity for ANY vehicle (not filtered by badge)
   */
  lookupByPlate: async (plate: string): Promise<{
    id: string
    plateNumber: string
    seatCapacity: number
    operatorName: string
    vehicleType: string
    source: string
  } | null> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate_number,
          seat_count,
          operator_name,
          vehicle_types:vehicle_type_id (
            name
          )
        `)
        .eq('plate_number', plate)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return {
        id: data.id,
        plateNumber: data.plate_number,
        seatCapacity: data.seat_count || 0,
        operatorName: data.operator_name || '',
        vehicleType: (data.vehicle_types as any)?.name || '',
        source: 'supabase',
      }
    } catch (error) {
      console.error('Error looking up vehicle by plate:', error)
      return null
    }
  },
}
