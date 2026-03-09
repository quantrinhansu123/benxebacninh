import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import type { Schedule, ScheduleInput, ValidateDayResponse, TripLimitResponse } from '@/types'

// Type-safe schedule service using Supabase directly

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
    try {
      // Get schedule to check calendar type
      const schedule = await scheduleService.getById(scheduleId)
      const dateObj = new Date(date)
      
      return {
        valid: true,
        calendarType: schedule.calendarType || 'daily',
        dayInMonth: dateObj.getDate(),
        daysOfMonth: [],
        frequencyType: schedule.frequencyType || 'daily',
        message: 'Day validation not fully implemented in Supabase',
      }
    } catch (error) {
      return {
        valid: false,
        calendarType: 'daily',
        dayInMonth: 0,
        daysOfMonth: [],
        frequencyType: 'daily',
        message: 'Error validating day',
      }
    }
  },

  checkTripLimit: async (routeId: string, vehiclePlateNumber: string, date: string): Promise<TripLimitResponse> => {
    // This would need custom logic - query dispatch_records for the route/vehicle/date
    try {
      // Query dispatch records for the route/vehicle/date
      const { data, error } = await supabase
        .from('dispatch_records')
        .select('id')
        .eq('route_id', routeId)
        .eq('vehicle_id', (await supabase
          .from('vehicles')
          .select('id')
          .eq('plate_number', vehiclePlateNumber)
          .single()
        ).data?.id || '')
        .gte('entry_time', `${date}T00:00:00`)
        .lt('entry_time', `${date}T23:59:59`)
      
      const currentTrips = data?.length || 0
      
      // Get route to check max trips
      const { data: route } = await supabase
        .from('routes')
        .select('total_trips_per_month')
        .eq('id', routeId)
        .single()
      
      const maxTrips = route?.total_trips_per_month || 0
      const remaining = maxTrips - currentTrips
      
      return {
        maxTrips,
        currentTrips,
        remaining,
        canIssue: remaining > 0,
      }
    } catch (error) {
      console.error('Error checking trip limit:', error)
      return {
        maxTrips: 0,
        currentTrips: 0,
        remaining: 0,
        canIssue: false,
      }
    }
  },
}
