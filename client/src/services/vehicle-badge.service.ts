import { supabase } from '@/lib/supabase'

export type OperationalStatus = 'trong_ben' | 'dang_chay'

export interface VehicleBadge {
  id: string
  badge_color: string
  badge_number: string
  badge_type: string
  bus_route_ref: string
  business_license_ref: string
  created_at: string
  created_by: string
  email_notification_sent: boolean
  expiry_date: string
  file_code: string
  issue_date: string
  issue_type: string
  issuing_authority_ref: string
  license_plate_sheet: string
  notes: string
  notification_ref: string
  previous_badge_number: string
  renewal_due_date: string
  renewal_reason: string
  renewal_reminder_shown: boolean
  replacement_vehicle_id: string
  revocation_date: string
  revocation_decision: string
  revocation_reason: string
  route_id: string
  route_code: string
  route_name: string
  itinerary: string
  status: string
  vehicle_id: string
  vehicle_type: string
  warn_duplicate_plate: boolean
  operational_status: OperationalStatus  // 'trong_ben' (in station) or 'dang_chay' (running)
}

export interface CreateVehicleBadgeInput {
  badge_number: string
  license_plate_sheet: string
  badge_type?: string
  badge_color?: string
  issue_date?: string
  expiry_date?: string
  status?: string
  file_code?: string
  issue_type?: string
  bus_route_ref?: string
  vehicle_type?: string
  notes?: string
}

export interface UpdateVehicleBadgeInput extends Partial<CreateVehicleBadgeInput> {}

export interface AllBadgesResponse {
  badges: (VehicleBadge & { is_expired: boolean })[]
  validCount: number
  expiredCount: number
}

// Frontend cache for badges
let badgesCache: VehicleBadge[] | null = null
let badgesCacheTime = 0
const FE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes frontend cache

export const vehicleBadgeService = {
  getAll: async (forceRefresh = false): Promise<VehicleBadge[]> => {
    try {
      const now = Date.now()
      
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && badgesCache && (now - badgesCacheTime) < FE_CACHE_TTL) {
        return badgesCache
      }
      
      const { data, error } = await supabase
        .from('vehicle_badges')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching vehicle badges:', error)
        return badgesCache || []
      }
      
      badgesCache = (data || []) as VehicleBadge[]
      badgesCacheTime = now
      return badgesCache
    } catch (error) {
      console.error('Error fetching vehicle badges:', error)
      return badgesCache || []
    }
  },
  
  clearCache: () => {
    badgesCache = null
    badgesCacheTime = 0
  },

  getById: async (id: string): Promise<VehicleBadge | null> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_badges')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return data as VehicleBadge
    } catch (error) {
      console.error('Error fetching vehicle badge by id:', error)
      return null
    }
  },

  getByPlateNumber: async (plateNumber: string): Promise<VehicleBadge | null> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_badges')
        .select('*')
        .eq('license_plate_sheet', plateNumber)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return data as VehicleBadge
    } catch (error) {
      console.error('Error fetching vehicle badge by plate number:', error)
      return null
    }
  },

  getAllByPlateNumber: async (plateNumber: string): Promise<AllBadgesResponse> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_badges')
        .select('*')
        .eq('license_plate_sheet', plateNumber)
        .order('created_at', { ascending: false })
      
      if (error) {
        return { badges: [], validCount: 0, expiredCount: 0 }
      }
      
      const badges = (data || []) as VehicleBadge[]
      const now = new Date()
      const validBadges = badges.filter(b => {
        if (!b.expiry_date) return true
        return new Date(b.expiry_date) >= now
      })
      const expiredBadges = badges.filter(b => {
        if (!b.expiry_date) return false
        return new Date(b.expiry_date) < now
      })
      
      return {
        badges: badges.map(b => ({
          ...b,
          is_expired: b.expiry_date ? new Date(b.expiry_date) < now : false,
        })),
        validCount: validBadges.length,
        expiredCount: expiredBadges.length,
      }
    } catch (error) {
      console.error('Error fetching all badges by plate number:', error)
      return { badges: [], validCount: 0, expiredCount: 0 }
    }
  },

  getStats: async (): Promise<{
    total: number
    active: number
    expired: number
    expiringSoon: number
  }> => {
    try {
      const { data, error } = await supabase
        .from('vehicle_badges')
        .select('expiry_date, status')
      
      if (error) {
        return { total: 0, active: 0, expired: 0, expiringSoon: 0 }
      }
      
      const now = new Date()
      const soonDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      
      let active = 0
      let expired = 0
      let expiringSoon = 0
      
      data?.forEach(badge => {
        if (badge.status === 'active' || badge.status === 'valid') {
          active++
        }
        if (badge.expiry_date) {
          const expiry = new Date(badge.expiry_date)
          if (expiry < now) {
            expired++
          } else if (expiry <= soonDate) {
            expiringSoon++
          }
        }
      })
      
      return {
        total: data?.length || 0,
        active,
        expired,
        expiringSoon,
      }
    } catch (error) {
      console.error('Error fetching vehicle badge stats:', error)
      return { total: 0, active: 0, expired: 0, expiringSoon: 0 }
    }
  },

  create: async (data: CreateVehicleBadgeInput): Promise<VehicleBadge> => {
    const { data: newBadge, error } = await supabase
      .from('vehicle_badges')
      .insert(data)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to create vehicle badge')
    }
    
    vehicleBadgeService.clearCache()
    return newBadge as VehicleBadge
  },

  update: async (id: string, data: UpdateVehicleBadgeInput): Promise<VehicleBadge> => {
    const { data: updatedBadge, error } = await supabase
      .from('vehicle_badges')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message || 'Failed to update vehicle badge')
    }
    
    vehicleBadgeService.clearCache()
    return updatedBadge as VehicleBadge
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vehicle_badges')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(error.message || 'Failed to delete vehicle badge')
    }
    
    vehicleBadgeService.clearCache()
  },
}
