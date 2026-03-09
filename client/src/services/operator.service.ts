import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import { supabaseCache, getCacheKey } from '@/lib/supabase-cache'
import type { Operator, OperatorInput } from '@/types'

// Essential fields only to reduce bandwidth
const OPERATOR_ESSENTIAL_FIELDS = 'id,code,name,tax_code,address,phone,email,is_active,created_at,updated_at'

export const operatorService = {
  getAll: async (isActive?: boolean, forceRefresh = false): Promise<Operator[]> => {
    try {
      const cacheKey = getCacheKey('operators', { isActive })
      
      // Check cache first (10 min TTL - operators don't change often)
      if (!forceRefresh) {
        const cached = supabaseCache.get<Operator[]>(cacheKey)
        if (cached) {
          return cached
        }
      }
      
      let query = supabase.from('operators').select(OPERATOR_ESSENTIAL_FIELDS)
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(500)

      if (error) {
        console.error('Error fetching operators:', error)
        return []
      }

      const result = (data || []).map(toCamelCase) as Operator[]
      
      // Cache result (10 minutes - operators are relatively static)
      supabaseCache.set(cacheKey, result, 10 * 60 * 1000)
      
      return result
    } catch (error) {
      console.error('Error fetching operators:', error)
      return []
    }
  },

  /**
   * Get all operators including legacy ones from datasheet
   * For Supabase, this just returns all operators (legacy distinction not needed)
   */
  getLegacy: async (): Promise<Operator[]> => {
    return operatorService.getAll()
  },

  getById: async (id: string): Promise<Operator> => {
    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(error.message || 'Operator not found')
    }
    
    return toCamelCase(data) as Operator
  },

  /**
   * Get next available operator code (DV001, DV002...)
   */
  getNextCode: async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('code')
        .order('code', { ascending: false })
        .limit(1)
      
      if (error || !data || data.length === 0) {
        return 'DV001'
      }

      const lastCode = data[0].code
      const match = lastCode?.match(/DV(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10) + 1
        return `DV${num.toString().padStart(3, '0')}`
      }
      
      return 'DV001'
    } catch (error) {
      console.error('Error getting next operator code:', error)
      return 'DV001'
    }
  },

  /**
   * Check if a tax code already exists
   */
  checkTaxCode: async (taxCode: string, excludeId?: string): Promise<{ exists: boolean; operatorName?: string }> => {
    try {
      let query = supabase
        .from('operators')
        .select('id, name, tax_code')
        .eq('tax_code', taxCode)
      
      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.limit(1)

      if (error || !data || data.length === 0) {
        return { exists: false }
      }

      return {
        exists: true,
        operatorName: data[0].name || undefined,
      }
    } catch (error) {
      console.error('Error checking tax code:', error)
      return { exists: false }
    }
  },

  create: async (input: OperatorInput): Promise<Operator> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('operators')
      .insert(snakeInput)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create operator')
    }
    
    return toCamelCase(data) as Operator
  },

  update: async (id: string, input: Partial<OperatorInput>): Promise<Operator> => {
    const snakeInput = toSnakeCase(input)
    const { data, error } = await supabase
      .from('operators')
      .update(snakeInput)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update operator')
    }
    
    return toCamelCase(data) as Operator
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('operators')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete operator')
    }
  },

  // Legacy operators - same as regular operators in Supabase
  updateLegacy: async (id: string, input: Partial<OperatorInput>): Promise<Operator> => {
    return operatorService.update(id, input)
  },

  deleteLegacy: async (id: string): Promise<void> => {
    return operatorService.delete(id)
  },
}
