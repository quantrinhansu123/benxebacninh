import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { Response } from 'express'
import type { AuthRequest } from '../../middleware/auth.js'

const mockSyncGtvtRoutesAndSchedules = jest.fn()
const mockGetGtvtLastSyncStatus = jest.fn()
const mockInvalidateQuanLyCache = jest.fn()

jest.unstable_mockModule('../../services/gtvt-route-schedule-sync.service.js', () => ({
  syncGtvtRoutesAndSchedules: mockSyncGtvtRoutesAndSchedules,
  getGtvtLastSyncStatus: mockGetGtvtLastSyncStatus,
}))

jest.unstable_mockModule('../quanly-data.controller.js', () => ({
  invalidateQuanLyCache: mockInvalidateQuanLyCache,
}))

const { syncGtvtRoutesSchedules, getGtvtLastSync } = await import('../gtvt-sync.controller.js')
const { GtvtConfigError, GtvtSourceError } = await import('../../types/gtvt-sync.types.js')

describe('GTVT Sync Controller', () => {
  let req: Partial<AuthRequest>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      user: {
        id: 'admin-001',
        username: 'admin',
        role: 'admin',
      },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  it('should sync successfully and invalidate cache on live mode', async () => {
    const syncResult = {
      mode: 'live',
      source: 'gtvt_appsheet_manual',
      startedAt: '2026-02-23T00:00:00.000Z',
      finishedAt: '2026-02-23T00:00:05.000Z',
      durationMs: 5000,
      summary: {
        incomingRoutes: 1,
        incomingSchedules: 1,
        insertedRoutes: 1,
        updatedRoutes: 0,
        disabledRoutes: 0,
        insertedSchedules: 1,
        updatedSchedules: 0,
        disabledSchedules: 0,
        failed: 0,
      },
      errors: [],
    }
    mockSyncGtvtRoutesAndSchedules.mockResolvedValue(syncResult)

    await syncGtvtRoutesSchedules(req as AuthRequest, res as Response)

    expect(mockSyncGtvtRoutesAndSchedules).toHaveBeenCalledWith({
      dryRun: false,
      triggeredBy: 'admin-001',
    })
    expect(mockInvalidateQuanLyCache).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(syncResult)
  })

  it('should not invalidate cache in dry-run mode', async () => {
    req.body = { dryRun: true }
    const syncResult = {
      mode: 'dry-run',
      source: 'gtvt_appsheet_manual',
      startedAt: '2026-02-23T00:00:00.000Z',
      finishedAt: '2026-02-23T00:00:01.000Z',
      durationMs: 1000,
      summary: {
        incomingRoutes: 0,
        incomingSchedules: 0,
        insertedRoutes: 0,
        updatedRoutes: 0,
        disabledRoutes: 0,
        insertedSchedules: 0,
        updatedSchedules: 0,
        disabledSchedules: 0,
        failed: 0,
      },
      errors: [],
    }
    mockSyncGtvtRoutesAndSchedules.mockResolvedValue(syncResult)

    await syncGtvtRoutesSchedules(req as AuthRequest, res as Response)

    expect(mockSyncGtvtRoutesAndSchedules).toHaveBeenCalledWith({
      dryRun: true,
      triggeredBy: 'admin-001',
    })
    expect(mockInvalidateQuanLyCache).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(syncResult)
  })

  it('should return 400 on config error', async () => {
    mockSyncGtvtRoutesAndSchedules.mockRejectedValue(new GtvtConfigError('Missing config'))

    await syncGtvtRoutesSchedules(req as AuthRequest, res as Response)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'GTVT sync configuration is invalid' })
  })

  it('should return 502 on source error', async () => {
    mockSyncGtvtRoutesAndSchedules.mockRejectedValue(new GtvtSourceError('Upstream failed'))

    await syncGtvtRoutesSchedules(req as AuthRequest, res as Response)

    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch data from GTVT upstream API' })
  })

  it('should return 409 when a sync is already in progress', async () => {
    mockSyncGtvtRoutesAndSchedules.mockRejectedValue(new GtvtSourceError('Another sync operation is already in progress'))

    await syncGtvtRoutesSchedules(req as AuthRequest, res as Response)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({ error: 'GTVT sync is already in progress' })
  })

  it('should get last sync info successfully', async () => {
    const lastSync = {
      source: 'gtvt_appsheet_manual',
      lastRouteSyncAt: '2026-02-23T00:00:05.000Z',
      lastScheduleSyncAt: '2026-02-23T00:00:05.000Z',
    }
    mockGetGtvtLastSyncStatus.mockResolvedValue(lastSync)

    await getGtvtLastSync(req as AuthRequest, res as Response)

    expect(mockGetGtvtLastSyncStatus).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(lastSync)
  })

  it('should return generic 500 error when last sync fails', async () => {
    mockGetGtvtLastSyncStatus.mockRejectedValue(new Error('database crashed'))

    await getGtvtLastSync(req as AuthRequest, res as Response)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch last sync info' })
  })
})
