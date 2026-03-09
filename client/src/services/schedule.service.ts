import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import type { Schedule, ScheduleInput, ValidateDayResponse, TripLimitResponse } from '@/types'

export const scheduleService = {
  getAll: async (routeId?: string, operatorId?: string, isActive?: boolean, direction?: string): Promise<Schedule[]> => {
    try {
      let query = supabase.from('schedules').select('*')
      
      if (routeId) {
        query = query.eq('route_id', routeId)
      }
      
      if (operatorId) {
        query = query.eq('operator_id', operatorId)
      }
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }
      
      if (direction) {
        query = query.eq('direction', direction)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching schedules:', error)
        return []
      }

      return (data || []).map(toCamelCase) as Schedule[]
    } catch (error) {
      console.error('Error fetching schedules:', error)
      return []
    }
  },

  getById: async (id: string): Promise<Schedule> => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Schedule not found')
    }
    
    return toCamelCase(data) as Schedule
  },

  create: async (input: ScheduleInput): Promise<Schedule> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('schedules')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create schedule')
    }
    
    return toCamelCase(data) as Schedule
  },

  update: async (id: string, input: Partial<ScheduleInput>): Promise<Schedule> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('schedules')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update schedule')
    }
    
    return toCamelCase(data) as Schedule
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete schedule')
    }
  },

  validateDay: async (scheduleId: string, date: string): Promise<ValidateDayResponse> => {
    // This would need custom logic - for now return a basic response
    // In production, you might need a Supabase function or handle this client-side
    return {
      isValid: true,
      message: 'Day validation not implemented in Supabase',
    }
  },

  checkTripLimit: async (routeId: string, vehiclePlateNumber: string, date: string): Promise<TripLimitResponse> => {
    // This would need custom logic - query dispatch_records for the route/vehicle/date
    // For now return a basic response
    return {
      withinLimit: true,
      currentTrips: 0,
      maxTrips: 0,
    }
  },
}
