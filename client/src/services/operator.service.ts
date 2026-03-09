import { supabase } from '@/lib/supabase'
import { toCamelCase, toSnakeCase } from '@/lib/supabase-utils'
import type { Operator, OperatorInput } from '@/types'

export const operatorService = {
  getAll: async (isActive?: boolean): Promise<Operator[]> => {
    try {
      let query = supabase.from('operators').select('*')
      
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching operators:', error)
        return []
      }

      return (data || []).map(toCamelCase) as Operator[]
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
