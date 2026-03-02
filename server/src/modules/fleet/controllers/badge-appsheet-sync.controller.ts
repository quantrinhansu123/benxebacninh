/**
 * Badge AppSheet Sync Controller
 * POST /api/vehicles/badges/appsheet-sync
 * Receives normalized badge data from frontend polling, upserts to vehicle_badges table
 */
import { Request, Response } from 'express'
import { vehicleBadges } from '../../../db/schema/vehicle-badges.js'
import { db } from '../../../db/drizzle.js'
import { sql } from 'drizzle-orm'

const MAX_BATCH_SIZE = 25_000
const MAX_STRING_LENGTH = 255
const BATCH_CHUNK_SIZE = 1000

interface SyncBadgePayload {
  badgeNumber: string
  plateNumber: string
  badgeType?: string
  fileNumber?: string
  operatorRef?: string
  issueDate?: string
  expiryDate?: string
  status?: string
  badgeColor?: string
  issueType?: string
  routeRef?: string
  busRouteRef?: string
  routeCode?: string
  routeName?: string
  oldBadgeNumber?: string
  renewalReason?: string
  revokeDecision?: string
  revokeReason?: string
  revokeDate?: string
  notes?: string
}

/** Sanitize string: trim + truncate */
const sanitize = (val: unknown, maxLen = MAX_STRING_LENGTH): string | undefined => {
  if (typeof val !== 'string') return undefined
  const trimmed = val.trim()
  return trimmed ? trimmed.slice(0, maxLen) : undefined
}

/** Normalize plate: remove dots, dashes, spaces → uppercase */
const normPlate = (raw: string): string =>
  (raw || '').replace(/[\s.\-]/g, '').toUpperCase()

export async function syncBadgesFromAppSheet(req: Request, res: Response) {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Database not available' })
    }

    const payload = req.body?.badges as SyncBadgePayload[] | undefined
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ error: 'badges array required' })
    }

    if (payload.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ error: `Max ${MAX_BATCH_SIZE} badges per batch` })
    }

    const validRecords: (typeof vehicleBadges.$inferInsert)[] = []
    const errors: string[] = []

    for (const b of payload) {
      if (!b.badgeNumber || typeof b.badgeNumber !== 'string') {
        errors.push(`Missing badgeNumber`)
        continue
      }

      const plate = b.plateNumber ? normPlate(b.plateNumber) : ''

      // Build metadata JSONB with extended fields
      const metadataObj: Record<string, string> = {}
      if (b.operatorRef) metadataObj.issuing_authority_ref = b.operatorRef
      if (b.badgeColor) metadataObj.badge_color = b.badgeColor
      if (b.issueType) metadataObj.issue_type = b.issueType
      if (b.routeRef) metadataObj.route_ref = b.routeRef
      if (b.busRouteRef) metadataObj.bus_route_ref = b.busRouteRef
      if (b.oldBadgeNumber) metadataObj.old_badge_number = b.oldBadgeNumber
      if (b.renewalReason) metadataObj.renewal_reason = b.renewalReason
      if (b.revokeDecision) metadataObj.revoke_decision = b.revokeDecision
      if (b.revokeReason) metadataObj.revoke_reason = b.revokeReason
      if (b.revokeDate) metadataObj.revoke_date = b.revokeDate
      if (b.notes) metadataObj.notes = b.notes

      validRecords.push({
        // Use badgeNumber as firebaseId for upsert key
        firebaseId: sanitize(b.badgeNumber, 100) || null,
        badgeNumber: sanitize(b.badgeNumber, 50) || null,
        plateNumber: plate || '',
        badgeType: sanitize(b.badgeType, 50) || null,
        routeCode: sanitize(b.routeCode, 50) || null,
        routeName: sanitize(b.routeName) || null,
        issueDate: sanitize(b.issueDate, 10) || null,
        expiryDate: sanitize(b.expiryDate, 10) || null,
        status: sanitize(b.status, 50) || 'active',
        metadata: metadataObj,
        source: 'appsheet',
        syncedAt: new Date(),
        isActive: true,
      })
    }

    // Batch upsert on firebaseId (badge number as unique key)
    let upserted = 0
    for (let i = 0; i < validRecords.length; i += BATCH_CHUNK_SIZE) {
      const chunk = validRecords.slice(i, i + BATCH_CHUNK_SIZE)
      try {
        await db
          .insert(vehicleBadges)
          .values(chunk)
          .onConflictDoUpdate({
            target: vehicleBadges.firebaseId,
            set: {
              badgeNumber: sql`excluded.badge_number`,
              plateNumber: sql`excluded.plate_number`,
              badgeType: sql`excluded.badge_type`,
              routeCode: sql`excluded.route_code`,
              routeName: sql`excluded.route_name`,
              issueDate: sql`excluded.issue_date`,
              expiryDate: sql`excluded.expiry_date`,
              status: sql`excluded.status`,
              syncedAt: sql`excluded.synced_at`,
              source: sql`excluded.source`,
              // JSONB shallow merge: preserves existing keys
              metadata: sql`COALESCE(${vehicleBadges.metadata}, '{}'::jsonb) || excluded.metadata::jsonb`,
              updatedAt: sql`now()`,
            },
          })
        upserted += chunk.length
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Batch ${i}-${i + chunk.length}: ${msg}`)
      }
    }

    return res.json({ upserted, errors })
  } catch (error) {
    console.error('[badge-appsheet-sync] Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
