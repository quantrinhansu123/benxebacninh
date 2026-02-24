import api from '@/lib/api'
import type { GtvtLastSyncResponse, GtvtSyncSummaryResponse } from '@/types/gtvt-sync.types'

export const gtvtSyncService = {
  syncRoutesSchedules: async (dryRun = false): Promise<GtvtSyncSummaryResponse> => {
    const response = await api.post<GtvtSyncSummaryResponse>('/integrations/gtvt/sync-routes-schedules', { dryRun })
    return response.data
  },

  getLastSync: async (): Promise<GtvtLastSyncResponse> => {
    const response = await api.get<GtvtLastSyncResponse>('/integrations/gtvt/last-sync')
    return response.data
  },
}

