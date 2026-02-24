import { sql } from 'drizzle-orm'
import { db } from '../db/drizzle.js'
import { operators, routes, schedules } from '../db/schema/index.js'
import { fetchGtvtRoutes, fetchGtvtSchedules } from './gtvt-appsheet-client.service.js'
import { cachedData } from './cached-data.service.js'
import { isRecord } from '../utils/type-guards.js'
import {
  GTVT_SYNC_SOURCE,
  GtvtSourceError,
  type GtvtLastSyncResponse,
  type GtvtNormalizedRoute,
  type GtvtNormalizedSchedule,
  type GtvtSyncErrorItem,
  type GtvtSyncOptions,
  type GtvtSyncSummaryResponse,
} from '../types/gtvt-sync.types.js'

const ROUTE_ID_KEYS = ['firebase_id', 'firebaseId', 'ID_TUYEN', 'ID_Tuyen', 'id', 'route_fb_id', 'routeFbId']
const ROUTE_CODE_KEYS = ['route_code', 'routeCode', 'MaTuyen', 'ma_tuyen', 'SoHieuTuyen', 'so_hieu_tuyen', 'Ref_Tuyen']
const ROUTE_CODE_OLD_KEYS = ['route_code_old', 'routeCodeOld', 'so_hieu_tuyen_old']
const ROUTE_TYPE_KEYS = ['route_type', 'routeType', 'LoaiTuyen']
const OPERATION_STATUS_KEYS = ['operation_status', 'operationStatus', 'TinhTrangKhaiThac']
const DEPARTURE_STATION_KEYS = ['departure_station', 'departureStation', 'BenDi', 'from_station']
const ARRIVAL_STATION_KEYS = ['arrival_station', 'arrivalStation', 'BenDen', 'to_station']
const DISTANCE_KEYS = ['distance_km', 'distanceKm', 'CuLy', 'cu_ly_km']

const SCHEDULE_ID_KEYS = ['firebase_id', 'firebaseId', 'ID_NutChay', 'id', 'schedule_id']
const SCHEDULE_CODE_KEYS = ['schedule_code', 'scheduleCode', 'MaBieuDo']
const SCHEDULE_ROUTE_ID_KEYS = ['route_fb_id', 'routeFbId', 'route_firebase_id', 'Ref_Tuyen']
const SCHEDULE_ROUTE_CODE_KEYS = ['route_code', 'routeCode', 'MaTuyen', 'SoHieuTuyen']
const SCHEDULE_OPERATOR_ID_KEYS = ['operator_fb_id', 'operatorFbId', 'Ref_DonVi', 'operator_firebase_id']
const SCHEDULE_OPERATOR_CODE_KEYS = ['operator_code', 'operatorCode', 'MaDonVi']
const SCHEDULE_TIME_KEYS = ['departure_time', 'departureTime', 'GioXuatBen']
const SCHEDULE_DIRECTION_KEYS = ['direction', 'Chieu']
const SCHEDULE_FREQUENCY_KEYS = ['frequency_type', 'frequencyType']
const SCHEDULE_DAYS_OF_WEEK_KEYS = ['days_of_week', 'daysOfWeek']
const SCHEDULE_DAYS_OF_MONTH_KEYS = ['days_of_month', 'daysOfMonth', 'NgayHoatDong']
const SCHEDULE_CALENDAR_KEYS = ['calendar_type', 'calendarType', 'LoaiNgay']
const SCHEDULE_EFFECTIVE_FROM_KEYS = ['effective_from', 'effectiveFrom', 'NgayBanHanh', 'ngay_ban_hanh']
const SCHEDULE_NOTIFICATION_KEYS = ['notification_number', 'notificationNumber', 'SoThongBao']
const SCHEDULE_TRIP_STATUS_KEYS = ['trip_status', 'tripStatus', 'TrangThaiChuyen']

const DEFAULT_DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 7]
const MAX_ROUTE_CODE_LENGTH = 50
const MAX_SCHEDULE_CODE_LENGTH = 50

const toLookupKey = (value: string | null | undefined): string => (value || '').trim().toUpperCase()

const pickString = (row: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key]
    if (value === undefined || value === null) continue
    if (typeof value === 'string') {
      const normalized = value.trim()
      if (normalized) return normalized
      continue
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }
  return null
}

const pickNumber = (row: Record<string, unknown>, keys: string[]): number | null => {
  const value = pickString(row, keys)
  if (!value) return null
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const parseDateValue = (value: string | null): string | null => {
  if (!value) return null
  const normalized = value.trim()
  const dmy = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    const year = dmy[3]
    return `${year}-${month}-${day}`
  }
  const ymd = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return ymd[0]
  return null
}

const parseTimeValue = (value: string | null): string | null => {
  if (!value) return null
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/)
  if (!match) return null
  return `${match[1]}:${match[2]}`
}

const parseIntArray = (value: unknown, min: number, max: number): number[] => {
  if (Array.isArray(value)) {
    return [...new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= min && item <= max)
    )].sort((a, b) => a - b)
  }

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isInteger(item) && item >= min && item <= max)
    return [...new Set(parsed)].sort((a, b) => a - b)
  }

  return []
}

const normalizeDirection = (value: string | null): string => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'về' || normalized === 've') return 'Về'
  return 'Đi'
}

const normalizeCalendarType = (value: string | null): string => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized.includes('âm') || normalized.includes('am') || normalized === 'lunar') return 'lunar'
  return 'solar'
}

const normalizeFrequencyType = (value: string | null, daysOfWeek: number[], daysOfMonth: number[]): 'daily' | 'weekly' | 'specific_days' => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'daily') return 'daily'
  if (normalized === 'weekly') return 'weekly'
  if (normalized === 'specific_days') return 'specific_days'
  if (daysOfMonth.length > 0 && daysOfMonth.length < 28) return 'specific_days'
  if (daysOfWeek.length > 0 && daysOfWeek.length < 7) return 'weekly'
  return 'daily'
}

const buildScheduleCode = (routeCode: string, direction: string, departureTime: string, suffix?: number): string => {
  const cleanedRouteCode = routeCode.replace(/[^A-Za-z0-9-]/g, '').toUpperCase() || 'UNKNOWN'
  const dirCode = direction === 'Về' ? 'V' : 'D'
  const timeCode = departureTime.replace(':', '')
  const baseCode = `BDG-${cleanedRouteCode}-${dirCode}-${timeCode}`
  if (!suffix || suffix <= 1) return baseCode
  return `${baseCode}-${suffix}`
}

const stripBusPrefix = (value: string): string => value.replace(/^BUS-/i, '').trim()

const ensureBusRouteCode = (value: string): { routeCode: string; routeCodeOld: string } => {
  const routeCodeOld = stripBusPrefix(value)
  return {
    routeCode: `BUS-${routeCodeOld}`,
    routeCodeOld,
  }
}

const escapeSqlString = (value: string | null): string => {
  if (value === null) return 'NULL'
  // Remove NULL bytes from external data, then escape single quotes for PostgreSQL
  return `'${value.replace(/\0/g, '').replace(/'/g, "''")}'`
}

const countFromRow = (row: Record<string, unknown> | undefined, key: string): number => {
  const value = row?.[key]
  return Number(value || 0)
}

type DbExecutor = NonNullable<typeof db>

const NULL_FIREBASE_SENTINEL = '__NULL_FIREBASE__'

const uniqueFirebaseIds = (firebaseIds: string[]): string[] => {
  const deduped = new Map<string, string>()
  firebaseIds.forEach((item) => {
    const trimmed = item.trim()
    if (!trimmed) return
    deduped.set(toLookupKey(trimmed), trimmed)
  })
  return [...deduped.values()]
}

const insertSeenFirebaseTempTable = async (
  executor: DbExecutor,
  tableName: '_tmp_gtvt_route_seen_ids' | '_tmp_gtvt_schedule_seen_ids',
  firebaseIds: string[]
): Promise<void> => {
  await executor.execute(sql.raw(`DROP TABLE IF EXISTS ${tableName}`))
  await executor.execute(sql.raw(`
    CREATE TEMP TABLE ${tableName} (
      firebase_id TEXT PRIMARY KEY
    )
  `))

  const uniqueIds = uniqueFirebaseIds(firebaseIds)
  if (uniqueIds.length === 0) return

  const chunkSize = 500
  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunk = uniqueIds.slice(index, index + chunkSize)
    const values = chunk.map((firebaseId) => `(${escapeSqlString(firebaseId)})`).join(',')
    await executor.execute(sql.raw(`INSERT INTO ${tableName} VALUES ${values}`))
  }
}

export function normalizeGtvtRoutes(
  rawRows: Record<string, unknown>[]
): { rows: GtvtNormalizedRoute[]; errors: GtvtSyncErrorItem[]; seenFirebaseIds: string[] } {
  const rows: GtvtNormalizedRoute[] = []
  const errors: GtvtSyncErrorItem[] = []
  const seenFirebaseIds = new Set<string>()

  rawRows.forEach((item, index) => {
    if (!isRecord(item)) return

    const firebaseId = pickString(item, ROUTE_ID_KEYS)
    if (firebaseId) seenFirebaseIds.add(firebaseId)
    const rawRouteCode = pickString(item, ROUTE_CODE_KEYS)
    const rawRouteCodeOld = pickString(item, ROUTE_CODE_OLD_KEYS)
    const soHieuTuyen = pickString(item, ['SoHieuTuyen', 'so_hieu_tuyen'])

    if (!firebaseId) {
      errors.push({ entity: 'route', key: `row-${index + 1}`, message: 'Missing route firebase id' })
      return
    }

    const baseRouteCode = rawRouteCode || rawRouteCodeOld || soHieuTuyen
    if (!baseRouteCode) {
      errors.push({ entity: 'route', key: firebaseId, message: 'Missing route code' })
      return
    }

    const routeTypeRaw = pickString(item, ROUTE_TYPE_KEYS)
    const isBusRoute = Boolean(soHieuTuyen) || baseRouteCode.toUpperCase().startsWith('BUS-') || (routeTypeRaw || '').toLowerCase() === 'bus'

    const normalizedBus = isBusRoute ? ensureBusRouteCode(rawRouteCodeOld || soHieuTuyen || baseRouteCode) : null
    const routeCode = normalizedBus ? normalizedBus.routeCode : baseRouteCode.trim()
    if (routeCode.length > MAX_ROUTE_CODE_LENGTH) {
      errors.push({ entity: 'route', key: firebaseId, message: `Route code exceeds ${MAX_ROUTE_CODE_LENGTH} characters` })
      return
    }
    const routeCodeOld = normalizedBus ? normalizedBus.routeCodeOld : (rawRouteCodeOld || null)
    const routeType = normalizedBus ? 'bus' : (routeTypeRaw || null)

    rows.push({
      firebaseId,
      routeCode,
      routeCodeOld,
      routeType,
      departureStation: pickString(item, DEPARTURE_STATION_KEYS),
      arrivalStation: pickString(item, ARRIVAL_STATION_KEYS),
      operationStatus: pickString(item, OPERATION_STATUS_KEYS),
      distanceKm: pickNumber(item, DISTANCE_KEYS),
      metadata: {
        provider: 'gtvt-appsheet',
      },
    })
  })

  return { rows, errors, seenFirebaseIds: [...seenFirebaseIds] }
}

export function normalizeGtvtSchedules(
  rawRows: Record<string, unknown>[]
): { rows: GtvtNormalizedSchedule[]; errors: GtvtSyncErrorItem[]; seenFirebaseIds: string[] } {
  const rows: GtvtNormalizedSchedule[] = []
  const errors: GtvtSyncErrorItem[] = []
  const seenFirebaseIds = new Set<string>()

  rawRows.forEach((item, index) => {
    if (!isRecord(item)) return

    const firebaseId = pickString(item, SCHEDULE_ID_KEYS)
    if (!firebaseId) {
      errors.push({ entity: 'schedule', key: `row-${index + 1}`, message: 'Missing schedule firebase id' })
      return
    }
    seenFirebaseIds.add(firebaseId)

    const departureTime = parseTimeValue(pickString(item, SCHEDULE_TIME_KEYS))
    if (!departureTime) {
      errors.push({ entity: 'schedule', key: firebaseId, message: 'Invalid or missing departure time' })
      return
    }

    const daysOfWeek = parseIntArray(item[SCHEDULE_DAYS_OF_WEEK_KEYS[0]] ?? item[SCHEDULE_DAYS_OF_WEEK_KEYS[1]], 1, 7)
    const daysOfMonth = parseIntArray(item[SCHEDULE_DAYS_OF_MONTH_KEYS[0]] ?? item[SCHEDULE_DAYS_OF_MONTH_KEYS[1]] ?? item[SCHEDULE_DAYS_OF_MONTH_KEYS[2]], 1, 31)
    const direction = normalizeDirection(pickString(item, SCHEDULE_DIRECTION_KEYS))
    const calendarType = normalizeCalendarType(pickString(item, SCHEDULE_CALENDAR_KEYS))
    const frequencyType = normalizeFrequencyType(pickString(item, SCHEDULE_FREQUENCY_KEYS), daysOfWeek, daysOfMonth)

    rows.push({
      firebaseId,
      routeFirebaseId: pickString(item, SCHEDULE_ROUTE_ID_KEYS),
      routeCode: pickString(item, SCHEDULE_ROUTE_CODE_KEYS),
      operatorFirebaseId: pickString(item, SCHEDULE_OPERATOR_ID_KEYS),
      operatorCode: pickString(item, SCHEDULE_OPERATOR_CODE_KEYS),
      scheduleCode: pickString(item, SCHEDULE_CODE_KEYS),
      departureTime,
      direction,
      frequencyType,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : (frequencyType === 'daily' ? DEFAULT_DAYS_OF_WEEK : []),
      daysOfMonth,
      calendarType,
      effectiveFrom: parseDateValue(pickString(item, SCHEDULE_EFFECTIVE_FROM_KEYS)) || '2025-01-01',
      notificationNumber: pickString(item, SCHEDULE_NOTIFICATION_KEYS),
      tripStatus: pickString(item, SCHEDULE_TRIP_STATUS_KEYS) || 'Hoạt động',
      metadata: {
        provider: 'gtvt-appsheet',
      },
    })
  })

  return { rows, errors, seenFirebaseIds: [...seenFirebaseIds] }
}

const runRoutesSync = async (
  executor: DbExecutor,
  routeRows: GtvtNormalizedRoute[],
  seenFirebaseIds: string[],
  dryRun: boolean,
  errors: GtvtSyncErrorItem[]
): Promise<{ inserted: number; updated: number; disabled: number }> => {
  const existingRouteCodes = await executor.select({
    firebaseId: routes.firebaseId,
    routeCode: routes.routeCode,
  }).from(routes)

  const existingCodeToFirebase = new Map<string, string>()
  existingRouteCodes.forEach((item) => {
    if (!item.routeCode) return
    existingCodeToFirebase.set(
      toLookupKey(item.routeCode),
      item.firebaseId ? toLookupKey(item.firebaseId) : NULL_FIREBASE_SENTINEL
    )
  })

  const dedupedByFirebase = new Map<string, GtvtNormalizedRoute>()
  routeRows.forEach((item) => {
    dedupedByFirebase.set(toLookupKey(item.firebaseId), item)
  })

  const incomingCodeToFirebase = new Map<string, string>()
  const persistedRows: GtvtNormalizedRoute[] = []
  for (const row of dedupedByFirebase.values()) {
    const firebaseKey = toLookupKey(row.firebaseId)
    const routeCodeKey = toLookupKey(row.routeCode)
    const existingFirebase = existingCodeToFirebase.get(routeCodeKey)
    if (existingFirebase && existingFirebase !== firebaseKey) {
      errors.push({ entity: 'route', key: row.firebaseId, message: `Route code conflict: ${row.routeCode}` })
      continue
    }
    const incomingFirebase = incomingCodeToFirebase.get(routeCodeKey)
    if (incomingFirebase && incomingFirebase !== firebaseKey) {
      errors.push({ entity: 'route', key: row.firebaseId, message: `Duplicate route code in payload: ${row.routeCode}` })
      continue
    }
    incomingCodeToFirebase.set(routeCodeKey, firebaseKey)
    persistedRows.push(row)
  }

  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_routes'))
  await executor.execute(sql.raw(`
    CREATE TEMP TABLE _tmp_gtvt_routes (
      firebase_id TEXT PRIMARY KEY,
      route_code TEXT NOT NULL,
      route_code_old TEXT,
      route_type TEXT,
      departure_station TEXT,
      arrival_station TEXT,
      operation_status TEXT,
      distance_km INTEGER,
      metadata JSONB
    )
  `))

  if (persistedRows.length > 0) {
    const chunkSize = 500
    for (let index = 0; index < persistedRows.length; index += chunkSize) {
      const chunk = persistedRows.slice(index, index + chunkSize)
      const values = chunk.map((row) => (
        `(${escapeSqlString(row.firebaseId)},${escapeSqlString(row.routeCode)},${escapeSqlString(row.routeCodeOld)},` +
        `${escapeSqlString(row.routeType)},${escapeSqlString(row.departureStation)},${escapeSqlString(row.arrivalStation)},` +
        `${escapeSqlString(row.operationStatus)},${row.distanceKm ?? 'NULL'},${escapeSqlString(JSON.stringify(row.metadata))})`
      )).join(',')
      await executor.execute(sql.raw(`INSERT INTO _tmp_gtvt_routes VALUES ${values}`))
    }
  }

  const seenRouteIds = uniqueFirebaseIds(seenFirebaseIds)
  const canDisableRoutes = seenRouteIds.length > 0
  if (canDisableRoutes) {
    await insertSeenFirebaseTempTable(executor, '_tmp_gtvt_route_seen_ids', seenRouteIds)
  } else {
    await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_route_seen_ids'))
  }

  const routeImpact = await executor.execute(sql.raw(`
    SELECT
      COUNT(*) FILTER (WHERE r.id IS NULL) AS inserted,
      COUNT(*) FILTER (WHERE r.id IS NOT NULL) AS updated
    FROM _tmp_gtvt_routes t
    LEFT JOIN routes r ON r.firebase_id = t.firebase_id
  `))
  const inserted = countFromRow(routeImpact[0] as Record<string, unknown>, 'inserted')
  const updated = countFromRow(routeImpact[0] as Record<string, unknown>, 'updated')

  let disabled = 0
  if (canDisableRoutes) {
    const disableCount = await executor.execute(sql.raw(`
      SELECT COUNT(*) AS disabled
      FROM routes r
      WHERE r.source = '${GTVT_SYNC_SOURCE}'
        AND r.is_active = true
        AND r.firebase_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM _tmp_gtvt_route_seen_ids t WHERE t.firebase_id = r.firebase_id
        )
    `))
    disabled = countFromRow(disableCount[0] as Record<string, unknown>, 'disabled')
  }

  if (!dryRun) {
    await executor.execute(sql.raw(`
      INSERT INTO routes (
        firebase_id, route_code, route_code_old, departure_station, arrival_station,
        distance_km, route_type, operation_status, is_active, source, metadata, synced_at, created_at, updated_at
      )
      SELECT
        t.firebase_id, t.route_code, t.route_code_old, t.departure_station, t.arrival_station,
        t.distance_km, t.route_type, t.operation_status, true, '${GTVT_SYNC_SOURCE}', t.metadata, NOW(), NOW(), NOW()
      FROM _tmp_gtvt_routes t
      ON CONFLICT (firebase_id) DO UPDATE SET
        route_code = EXCLUDED.route_code,
        route_code_old = EXCLUDED.route_code_old,
        departure_station = EXCLUDED.departure_station,
        arrival_station = EXCLUDED.arrival_station,
        distance_km = EXCLUDED.distance_km,
        route_type = EXCLUDED.route_type,
        operation_status = EXCLUDED.operation_status,
        is_active = true,
        source = '${GTVT_SYNC_SOURCE}',
        metadata = EXCLUDED.metadata,
        synced_at = NOW(),
        updated_at = NOW()
    `))

    if (canDisableRoutes) {
      await executor.execute(sql.raw(`
        UPDATE routes
        SET is_active = false, updated_at = NOW()
        WHERE source = '${GTVT_SYNC_SOURCE}'
          AND is_active = true
          AND firebase_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM _tmp_gtvt_route_seen_ids t WHERE t.firebase_id = routes.firebase_id
          )
      `))
    }
  }

  return { inserted, updated, disabled }
}

interface ResolvedScheduleRow {
  firebaseId: string
  routeId: string
  operatorId: string
  scheduleCode: string
  departureTime: string
  direction: string
  frequencyType: 'daily' | 'weekly' | 'specific_days'
  daysOfWeek: number[]
  daysOfMonth: number[]
  calendarType: string
  effectiveFrom: string
  notificationNumber: string | null
  tripStatus: string
  metadata: Record<string, unknown>
}

const runSchedulesSync = async (
  executor: DbExecutor,
  scheduleRows: GtvtNormalizedSchedule[],
  routeRows: GtvtNormalizedRoute[],
  seenFirebaseIds: string[],
  dryRun: boolean,
  errors: GtvtSyncErrorItem[]
): Promise<{ inserted: number; updated: number; disabled: number; failed: number }> => {
  const operatorData = await executor.select({
    id: operators.id,
    firebaseId: operators.firebaseId,
    code: operators.code,
  }).from(operators)

  const routeData = await executor.select({
    id: routes.id,
    firebaseId: routes.firebaseId,
    routeCode: routes.routeCode,
    routeCodeOld: routes.routeCodeOld,
    isActive: routes.isActive,
  }).from(routes)

  const operatorByFirebase = new Map<string, string>()
  const operatorByCode = new Map<string, string>()
  operatorData.forEach((item) => {
    if (item.firebaseId) operatorByFirebase.set(toLookupKey(item.firebaseId), item.id)
    if (item.code) operatorByCode.set(toLookupKey(item.code), item.id)
  })

  const routeByFirebase = new Map<string, { id: string; routeCode: string | null; routeCodeOld: string | null }>()
  const routeByCode = new Map<string, { id: string; routeCode: string | null; routeCodeOld: string | null }>()
  routeData.forEach((item) => {
    if (!item.isActive) return
    const mapped = { id: item.id, routeCode: item.routeCode, routeCodeOld: item.routeCodeOld }
    if (item.firebaseId) routeByFirebase.set(toLookupKey(item.firebaseId), mapped)
    if (item.routeCode) routeByCode.set(toLookupKey(item.routeCode), mapped)
    if (item.routeCodeOld) routeByCode.set(toLookupKey(item.routeCodeOld), mapped)
  })

  const incomingRouteKeys = new Set<string>()
  routeRows.forEach((item) => {
    incomingRouteKeys.add(toLookupKey(item.firebaseId))
    incomingRouteKeys.add(toLookupKey(item.routeCode))
    if (item.routeCodeOld) incomingRouteKeys.add(toLookupKey(item.routeCodeOld))
  })

  const codeCounter = new Map<string, number>()
  const resolvedRows: ResolvedScheduleRow[] = []
  let failed = 0

  for (const row of scheduleRows) {
    let operatorId: string | null = null
    if (row.operatorFirebaseId) {
      operatorId = operatorByFirebase.get(toLookupKey(row.operatorFirebaseId)) || null
    }
    if (!operatorId && row.operatorCode) {
      operatorId = operatorByCode.get(toLookupKey(row.operatorCode)) || null
    }
    if (!operatorId) {
      failed += 1
      errors.push({ entity: 'schedule', key: row.firebaseId, message: 'Operator not found' })
      continue
    }

    let routeMatch: { id: string; routeCode: string | null; routeCodeOld: string | null } | null = null
    if (row.routeFirebaseId) routeMatch = routeByFirebase.get(toLookupKey(row.routeFirebaseId)) || null
    if (!routeMatch && row.routeCode) routeMatch = routeByCode.get(toLookupKey(row.routeCode)) || null
    if (!routeMatch && row.routeCode && !row.routeCode.toUpperCase().startsWith('BUS-')) {
      routeMatch = routeByCode.get(toLookupKey(`BUS-${row.routeCode}`)) || null
    }
    if (!routeMatch && row.routeCode && row.routeCode.toUpperCase().startsWith('BUS-')) {
      routeMatch = routeByCode.get(toLookupKey(stripBusPrefix(row.routeCode))) || null
    }

    if (!routeMatch) {
      const dryRunRouteHit =
        (row.routeFirebaseId && incomingRouteKeys.has(toLookupKey(row.routeFirebaseId))) ||
        (row.routeCode && incomingRouteKeys.has(toLookupKey(row.routeCode))) ||
        (row.routeCode && incomingRouteKeys.has(toLookupKey(`BUS-${stripBusPrefix(row.routeCode)}`)))

      if (!dryRun || !dryRunRouteHit) {
        failed += 1
        errors.push({ entity: 'schedule', key: row.firebaseId, message: 'Route not found' })
        continue
      }
    }

    const routeCodeForSchedule =
      routeMatch?.routeCodeOld || routeMatch?.routeCode || row.routeCode || row.routeFirebaseId || 'UNKNOWN'
    const baseCode = row.scheduleCode || buildScheduleCode(routeCodeForSchedule, row.direction, row.departureTime)
    const nextCount = (codeCounter.get(baseCode) || 0) + 1
    codeCounter.set(baseCode, nextCount)
    const scheduleCode = row.scheduleCode || buildScheduleCode(routeCodeForSchedule, row.direction, row.departureTime, nextCount)
    if (scheduleCode.length > MAX_SCHEDULE_CODE_LENGTH) {
      failed += 1
      errors.push({ entity: 'schedule', key: row.firebaseId, message: `Schedule code exceeds ${MAX_SCHEDULE_CODE_LENGTH} characters` })
      continue
    }

    if (!routeMatch && dryRun) {
      resolvedRows.push({
        firebaseId: row.firebaseId,
        routeId: '00000000-0000-0000-0000-000000000000',
        operatorId,
        scheduleCode,
        departureTime: row.departureTime,
        direction: row.direction,
        frequencyType: row.frequencyType,
        daysOfWeek: row.daysOfWeek,
        daysOfMonth: row.daysOfMonth,
        calendarType: row.calendarType,
        effectiveFrom: row.effectiveFrom,
        notificationNumber: row.notificationNumber,
        tripStatus: row.tripStatus,
        metadata: row.metadata,
      })
      continue
    }

    if (!routeMatch) {
      failed += 1
      errors.push({ entity: 'schedule', key: row.firebaseId, message: 'Route resolution failed' })
      continue
    }

    resolvedRows.push({
      firebaseId: row.firebaseId,
      routeId: routeMatch.id,
      operatorId,
      scheduleCode,
      departureTime: row.departureTime,
      direction: row.direction,
      frequencyType: row.frequencyType,
      daysOfWeek: row.daysOfWeek,
      daysOfMonth: row.daysOfMonth,
      calendarType: row.calendarType,
      effectiveFrom: row.effectiveFrom,
      notificationNumber: row.notificationNumber,
      tripStatus: row.tripStatus,
      metadata: row.metadata,
    })
  }

  const existingSchedules = await executor.select({
    firebaseId: schedules.firebaseId,
    scheduleCode: schedules.scheduleCode,
    source: schedules.source,
    isActive: schedules.isActive,
  }).from(schedules)

  const dedupedByFirebase = new Map<string, ResolvedScheduleRow>()
  resolvedRows.forEach((item) => {
    dedupedByFirebase.set(toLookupKey(item.firebaseId), item)
  })

  const existingCodeToFirebase = new Map<string, string>()
  existingSchedules.forEach((item) => {
    if (!item.scheduleCode) return
    existingCodeToFirebase.set(
      toLookupKey(item.scheduleCode),
      item.firebaseId ? toLookupKey(item.firebaseId) : NULL_FIREBASE_SENTINEL
    )
  })

  const incomingCodeToFirebase = new Map<string, string>()
  const persistedRows: ResolvedScheduleRow[] = []
  for (const row of dedupedByFirebase.values()) {
    const firebaseKey = toLookupKey(row.firebaseId)
    const scheduleCodeKey = toLookupKey(row.scheduleCode)
    const existingFirebase = existingCodeToFirebase.get(scheduleCodeKey)
    if (existingFirebase && existingFirebase !== firebaseKey) {
      failed += 1
      errors.push({ entity: 'schedule', key: row.firebaseId, message: `Schedule code conflict: ${row.scheduleCode}` })
      continue
    }
    const incomingFirebase = incomingCodeToFirebase.get(scheduleCodeKey)
    if (incomingFirebase && incomingFirebase !== firebaseKey) {
      failed += 1
      errors.push({ entity: 'schedule', key: row.firebaseId, message: `Duplicate schedule code in payload: ${row.scheduleCode}` })
      continue
    }
    incomingCodeToFirebase.set(scheduleCodeKey, firebaseKey)
    persistedRows.push(row)
  }

  const existingByFirebase = new Set(
    existingSchedules
      .filter((item) => item.firebaseId)
      .map((item) => toLookupKey(item.firebaseId))
  )
  const seenScheduleIds = uniqueFirebaseIds(seenFirebaseIds)
  const canDisableSchedules = seenScheduleIds.length > 0
  const incomingFirebase = new Set(seenScheduleIds.map((item) => toLookupKey(item)))

  const inserted = persistedRows.filter((item) => !existingByFirebase.has(toLookupKey(item.firebaseId))).length
  const updated = persistedRows.length - inserted

  const disabled = canDisableSchedules
    ? existingSchedules.filter((item) => (
      item.source === GTVT_SYNC_SOURCE &&
      item.isActive === true &&
      item.firebaseId !== null &&
      !incomingFirebase.has(toLookupKey(item.firebaseId))
    )).length
    : 0

  if (dryRun) {
    return { inserted, updated, disabled, failed }
  }

  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_schedules'))
  await executor.execute(sql.raw(`
    CREATE TEMP TABLE _tmp_gtvt_schedules (
      firebase_id TEXT PRIMARY KEY,
      schedule_code TEXT NOT NULL,
      route_id UUID NOT NULL,
      operator_id UUID NOT NULL,
      departure_time TEXT NOT NULL,
      direction TEXT,
      frequency_type TEXT NOT NULL,
      days_of_week JSONB,
      days_of_month JSONB,
      calendar_type TEXT,
      effective_from TEXT,
      notification_number TEXT,
      trip_status TEXT,
      metadata JSONB
    )
  `))

  if (persistedRows.length > 0) {
    const chunkSize = 500
    for (let index = 0; index < persistedRows.length; index += chunkSize) {
      const chunk = persistedRows.slice(index, index + chunkSize)
      const values = chunk.map((row) => (
        `(${escapeSqlString(row.firebaseId)},${escapeSqlString(row.scheduleCode)},${escapeSqlString(row.routeId)},` +
        `${escapeSqlString(row.operatorId)},${escapeSqlString(row.departureTime)},${escapeSqlString(row.direction)},` +
        `${escapeSqlString(row.frequencyType)},${escapeSqlString(JSON.stringify(row.daysOfWeek))},` +
        `${escapeSqlString(JSON.stringify(row.daysOfMonth))},${escapeSqlString(row.calendarType)},` +
        `${escapeSqlString(row.effectiveFrom)},${escapeSqlString(row.notificationNumber)},` +
        `${escapeSqlString(row.tripStatus)},${escapeSqlString(JSON.stringify(row.metadata))})`
      )).join(',')
      await executor.execute(sql.raw(`INSERT INTO _tmp_gtvt_schedules VALUES ${values}`))
    }
  }

  if (canDisableSchedules) {
    await insertSeenFirebaseTempTable(executor, '_tmp_gtvt_schedule_seen_ids', seenScheduleIds)
  } else {
    await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_schedule_seen_ids'))
  }

  await executor.execute(sql.raw(`
    INSERT INTO schedules (
      firebase_id, schedule_code, route_id, operator_id,
      departure_time, direction, frequency_type, days_of_week, days_of_month,
      calendar_type, effective_from, notification_number, trip_status,
      is_active, source, synced_at, metadata, created_at, updated_at
    )
    SELECT
      t.firebase_id, t.schedule_code, t.route_id, t.operator_id,
      t.departure_time::time, t.direction, t.frequency_type, t.days_of_week, t.days_of_month,
      t.calendar_type, t.effective_from, t.notification_number, t.trip_status,
      true, '${GTVT_SYNC_SOURCE}', NOW(), t.metadata, NOW(), NOW()
    FROM _tmp_gtvt_schedules t
    ON CONFLICT (firebase_id) DO UPDATE SET
      schedule_code = EXCLUDED.schedule_code,
      route_id = EXCLUDED.route_id,
      operator_id = EXCLUDED.operator_id,
      departure_time = EXCLUDED.departure_time,
      direction = EXCLUDED.direction,
      frequency_type = EXCLUDED.frequency_type,
      days_of_week = EXCLUDED.days_of_week,
      days_of_month = EXCLUDED.days_of_month,
      calendar_type = EXCLUDED.calendar_type,
      effective_from = EXCLUDED.effective_from,
      notification_number = EXCLUDED.notification_number,
      trip_status = EXCLUDED.trip_status,
      is_active = true,
      source = '${GTVT_SYNC_SOURCE}',
      synced_at = NOW(),
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
  `))

  if (canDisableSchedules) {
    await executor.execute(sql.raw(`
      UPDATE schedules
      SET is_active = false, updated_at = NOW()
      WHERE source = '${GTVT_SYNC_SOURCE}'
        AND is_active = true
        AND firebase_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM _tmp_gtvt_schedule_seen_ids t WHERE t.firebase_id = schedules.firebase_id
        )
    `))
  }

  return { inserted, updated, disabled, failed }
}

const cleanupTempTables = async (executor: DbExecutor): Promise<void> => {
  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_schedules'))
  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_routes'))
  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_route_seen_ids'))
  await executor.execute(sql.raw('DROP TABLE IF EXISTS _tmp_gtvt_schedule_seen_ids'))
}

export async function getGtvtLastSyncStatus(): Promise<GtvtLastSyncResponse> {
  if (!db) throw new GtvtSourceError('Database connection not available')

  const [routeResult, scheduleResult] = await Promise.all([
    db.execute(sql.raw(`
      SELECT MAX(synced_at) AS synced_at
      FROM routes
      WHERE source = '${GTVT_SYNC_SOURCE}'
    `)),
    db.execute(sql.raw(`
      SELECT MAX(synced_at) AS synced_at
      FROM schedules
      WHERE source = '${GTVT_SYNC_SOURCE}'
    `)),
  ])

  const routeDate = routeResult[0]?.synced_at
  const scheduleDate = scheduleResult[0]?.synced_at

  return {
    source: GTVT_SYNC_SOURCE,
    lastRouteSyncAt: routeDate ? new Date(String(routeDate)).toISOString() : null,
    lastScheduleSyncAt: scheduleDate ? new Date(String(scheduleDate)).toISOString() : null,
  }
}

// Advisory lock key to prevent concurrent sync operations
const GTVT_SYNC_LOCK_KEY = 737001

export async function syncGtvtRoutesAndSchedules(options: GtvtSyncOptions): Promise<GtvtSyncSummaryResponse> {
  if (!db) throw new GtvtSourceError('Database connection not available')

  const startedAt = new Date()
  const mode = options.dryRun ? 'dry-run' : 'live'
  const errors: GtvtSyncErrorItem[] = []

  try {
    const [rawRoutes, rawSchedules] = await Promise.all([
      fetchGtvtRoutes(),
      fetchGtvtSchedules(),
    ])

    const normalizedRoutes = normalizeGtvtRoutes(rawRoutes)
    const normalizedSchedules = normalizeGtvtSchedules(rawSchedules)
    // Track normalization errors separately to avoid double-counting in summary.failed
    const normalizationErrorCount = normalizedRoutes.errors.length + normalizedSchedules.errors.length
    errors.push(...normalizedRoutes.errors, ...normalizedSchedules.errors)

    const hasSeenUpstreamData = (
      normalizedRoutes.seenFirebaseIds.length > 0 ||
      normalizedSchedules.seenFirebaseIds.length > 0
    )
    if (!options.dryRun && !hasSeenUpstreamData) {
      throw new GtvtSourceError('Upstream API returned empty datasets; sync aborted to prevent mass deactivation')
    }

    const result = await db.transaction(async (tx) => {
      const executor = tx as unknown as DbExecutor
      const lockRows = await executor.execute(sql.raw(`SELECT pg_try_advisory_xact_lock(${GTVT_SYNC_LOCK_KEY}) AS acquired`))
      const acquired = (lockRows[0] as Record<string, unknown>)?.acquired
      if (!acquired) {
        throw new GtvtSourceError('Another sync operation is already in progress')
      }

      const routeSyncStats = await runRoutesSync(
        executor,
        normalizedRoutes.rows,
        normalizedRoutes.seenFirebaseIds,
        options.dryRun,
        errors
      )
      const scheduleSyncStats = await runSchedulesSync(
        executor,
        normalizedSchedules.rows,
        normalizedRoutes.rows,
        normalizedSchedules.seenFirebaseIds,
        options.dryRun,
        errors
      )
      await cleanupTempTables(executor)
      return {
        routeSyncStats,
        scheduleSyncStats,
      }
    })
    const routeStats = result.routeSyncStats
    const scheduleStats = result.scheduleSyncStats

    if (!options.dryRun) {
      cachedData.invalidateRoutes()
      cachedData.invalidateSchedules()
    }

    const finishedAt = new Date()
    return {
      mode,
      source: GTVT_SYNC_SOURCE,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      summary: {
        incomingRoutes: normalizedRoutes.rows.length,
        incomingSchedules: normalizedSchedules.rows.length,
        insertedRoutes: routeStats.inserted,
        updatedRoutes: routeStats.updated,
        disabledRoutes: routeStats.disabled,
        insertedSchedules: scheduleStats.inserted,
        updatedSchedules: scheduleStats.updated,
        disabledSchedules: scheduleStats.disabled,
        failed: normalizationErrorCount + scheduleStats.failed,
      },
      errors,
    }
  } catch (error) {
    await cleanupTempTables(db)
    throw error
  }
}
