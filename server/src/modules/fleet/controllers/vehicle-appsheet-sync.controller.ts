/**
 * Vehicle AppSheet Sync Controller
 * POST /api/vehicles/appsheet-sync
 * Receives normalized vehicle data from frontend polling, upserts to DB
 * Only updates AppSheet-sourced fields, preserves user-edited fields
 */
import { Request, Response } from 'express'
import { vehicles } from '../../../db/schema/vehicles.js'
import { db } from '../../../db/drizzle.js'
import { sql } from 'drizzle-orm'

const MAX_BATCH_SIZE = 500
const MAX_STRING_LENGTH = 100

interface SyncVehiclePayload {
  firebaseId: string
  plateNumber: string
  registrationName?: string
  seatCapacity?: number
  source: 'appsheet'
  syncedAt: string
}

/** Normalize plate: remove dots, dashes, spaces → uppercase */
const normPlate = (raw: string): string =>
  (raw || '').replace(/[\s.\-]/g, '').toUpperCase()

/** Sanitize string: trim + truncate to max length */
const sanitize = (val: unknown, maxLen = MAX_STRING_LENGTH): string | undefined => {
  if (typeof val !== 'string') return undefined
  const trimmed = val.trim()
  return trimmed ? trimmed.slice(0, maxLen) : undefined
}

export async function syncVehiclesFromAppSheet(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const payload = req.body?.vehicles as SyncVehiclePayload[] | undefined
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ error: 'vehicles array required' })
    }

    // Prevent oversized payloads
    if (payload.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: `Max ${MAX_BATCH_SIZE} vehicles per batch` })
    }

    let upserted = 0
    const errors: string[] = []

    for (const v of payload) {
      if (!v.plateNumber || typeof v.plateNumber !== 'string') {
        errors.push(`Missing/invalid plateNumber for firebaseId=${v.firebaseId}`)
        continue
      }

      const plate = normPlate(v.plateNumber)
      if (!plate || plate.length > 20) {
        errors.push(`Invalid plate format: ${v.plateNumber}`)
        continue
      }

      const regName = sanitize(v.registrationName)
      // Use parameterized jsonb value (safe from injection)
      const metadataObj = regName ? { registration_name: regName } : {}

      try {
        await db
          .insert(vehicles)
          .values({
            plateNumber: plate,
            firebaseId: sanitize(v.firebaseId) || null,
            seatCount: typeof v.seatCapacity === 'number' ? v.seatCapacity : null,
            source: 'appsheet',
            syncedAt: new Date(v.syncedAt),
            metadata: metadataObj,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: vehicles.plateNumber,
            set: {
              syncedAt: new Date(v.syncedAt),
              source: sql`COALESCE(${vehicles.source}, 'appsheet')`,
              // Parameterized: Drizzle binds jsonb safely via $1
              metadata: sql`COALESCE(${vehicles.metadata}, '{}'::jsonb) || ${sql.param(JSON.stringify(metadataObj))}::jsonb`,
              // Also update seatCount if AppSheet provides it
              ...(typeof v.seatCapacity === 'number'
                ? { seatCount: v.seatCapacity }
                : {}),
              updatedAt: new Date(),
            },
          })

        upserted++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`plate=${plate}: ${msg}`)
      }
    }

    return res.json({ upserted, errors })
  } catch (error) {
    console.error('[vehicle-appsheet-sync] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
