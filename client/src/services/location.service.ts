import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import type { Location, LocationInput } from '@/types'

export const locationService = {
  getAll: async (isActive?: boolean): Promise<Location[]> => {
    try {
      let query = supabase.from('locations').select('*')
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching locations:', error)
        return []
      }

      return (data || []).map(toCamelCase) as Location[]
    } catch (error) {
      console.error('Error fetching locations:', error)
      return []
    }
  },

  getById: async (id: string): Promise<Location> => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Location not found')
    }
    
    return toCamelCase(data) as Location
  },

  create: async (input: LocationInput): Promise<Location> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('locations')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create location')
    }
    
    return toCamelCase(data) as Location
  },

  update: async (id: string, input: Partial<LocationInput>): Promise<Location> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('locations')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update location')
    }
    
    return toCamelCase(data) as Location
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete location')
    }
  },
}
