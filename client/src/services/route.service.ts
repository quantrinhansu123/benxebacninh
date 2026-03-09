import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import type { Route, RouteInput } from '@/types'

export interface LegacyRoute {
  id: string
  routeCode: string
  routeCodeOld: string
  routeCodeFixed: string
  routeClass: string
  routeType: string
  routePath: string
  departureStation: string
  departureStationRef: string
  departureProvince: string
  departureProvinceOld: string
  arrivalStation: string
  arrivalStationRef: string
  arrivalProvince: string
  arrivalProvinceOld: string
  distanceKm: number
  minIntervalMinutes: number
  totalTripsMonth: number
  tripsInOperation: number
  remainingCapacity: number
  operationStatus: string
  calendarType: string
  decisionNumber: string
  decisionDate: string
  issuingAuthority: string
  notes: string
  filePath: string
  _source: string
}

// Cache for legacy routes
let legacyRoutesCache: { data: LegacyRoute[]; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const routeService = {
  getAll: async (_operatorId?: string, _limit?: number, isActive?: boolean): Promise<Route[]> => {
    try {
      let query = supabase.from('routes').select('*')
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      if (_limit) {
        query = query.limit(_limit)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching routes:', error)
        return []
      }

      return (data || []).map(toCamelCase) as Route[]
    } catch (error) {
      console.error('Error fetching routes:', error)
      return []
    }
  },

  getLegacy: async (forceRefresh = false): Promise<LegacyRoute[]> => {
    try {
      // Check cache
      if (!forceRefresh && legacyRoutesCache && Date.now() - legacyRoutesCache.timestamp < CACHE_TTL) {
        return legacyRoutesCache.data
      }

      // In Supabase, legacy routes are just routes with source='legacy' or similar
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching legacy routes:', error)
        if (legacyRoutesCache) {
          return legacyRoutesCache.data
        }
        return []
      }

      const routes = (data || []).map(toCamelCase) as LegacyRoute[]
      
      // Update cache
      legacyRoutesCache = { data: routes, timestamp: Date.now() }
      
      return routes
    } catch (error) {
      console.error('Error fetching legacy routes:', error)
      if (legacyRoutesCache) {
        return legacyRoutesCache.data
      }
      return []
    }
  },

  getById: async (id: string): Promise<Route> => {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Route not found')
    }
    
    return toCamelCase(data) as Route
  },

  create: async (input: RouteInput): Promise<Route> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('routes')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create route')
    }
    
    return toCamelCase(data) as Route
  },

  update: async (id: string, input: Partial<RouteInput>): Promise<Route> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('routes')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update route')
    }
    
    return toCamelCase(data) as Route
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete route')
    }
  },
}
