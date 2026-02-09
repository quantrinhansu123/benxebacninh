/**
 * Sync vehicle_badges from Google Sheet CSV (source of truth)
 *
 * Key mappings:
 *   - CSV ID_PhuHieu  → DB firebase_id (match key)
 *   - CSV BienSoXe    → Firebase vehicle ref (NOT a plate number!)
 *                       → lookup id_mappings(vehicles) → vehicles.plate_number
 *   - plateNumber in DB is already resolved to real plate, do NOT overwrite
 *     with Firebase ref from CSV
 *
 * Actions:
 *   1. Fetch CSV from Google Sheets
 *   2. Load all existing badges from DB (keyed by firebase_id)
 *   3. Build Firebase vehicle ref → real plate_number lookup
 *   4. Compare & categorize: INSERT new, UPDATE changed
 *   5. Apply changes (or dry-run)
 *
 * Usage: npx tsx sync-vehicle-badges-from-sheet.ts [--dry-run]
 */
import 'dotenv/config'
import { db } from '../../drizzle.js'
import { vehicleBadges, vehicles, idMappings } from '../../schema/index.js'
import { eq } from 'drizzle-orm'

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/16R5NPyZ-jMPq4Jnqgjl8pbK3ScrD_8GeG0Fv4-gJQhY/gviz/tq?tqx=out:csv&gid=1560762265'

// ─── Types ───

interface SheetRow {
  ID_PhuHieu: string
  MaHoSo: string
  LoaiPH: string
  SoPhuHieu: string
  BienSoXe: string       // Firebase vehicle ref, NOT real plate number
  Ref_DonViCapPhuHieu: string
  Ref_GPKD: string
  Ref_Tuyen: string
  NgayCap: string
  NgayHetHan: string
  LoaiCap: string
  LyDoCapLai: string
  SoPhuHieuCu: string
  TrangThai: string
  QDThuHoi: string
  LyDoThuHoi: string
  NgayThuHoi: string
  XeThayThe: string
  MauPhuHieu: string
  GhiChu: string
  Xebithaythe: string
  Hancap: string
}

// ─── Helpers ───

/** Parse CSV text into array of objects (handles quoted fields with commas) */
function parseCSV(text: string): SheetRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim()); current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseRow(lines[0])
  const results: SheetRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i])
    const obj: any = {}
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = vals[j] || ''
    }
    results.push(obj)
  }
  return results
}

/** Convert dd/MM/yyyy → yyyy-MM-dd, validates result */
function parseDate(d: string): string {
  if (!d) return ''
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const day = parseInt(m[1], 10)
  const month = parseInt(m[2], 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Map sheet TrangThai → DB status */
function mapStatus(s: string): string {
  if (!s) return 'active'
  const lower = s.toLowerCase().trim()
  if (lower.includes('thu hồi')) return 'revoked'
  if (lower.includes('hết hiệu lực') || lower.includes('hết hạn')) return 'expired'
  if (lower.includes('hiệu lực')) return 'active'
  return 'active'
}

/** Build metadata from CSV row (snake_case keys matching existing ETL) */
function buildMetadata(row: SheetRow): Record<string, string> {
  const m: Record<string, string> = {}
  if (row.LoaiPH) m.badge_type = row.LoaiPH
  if (row.MaHoSo) m.file_number = row.MaHoSo
  if (row.LoaiCap) m.issue_type = row.LoaiCap
  if (row.MauPhuHieu) m.badge_color = row.MauPhuHieu
  if (row.GhiChu) m.notes = row.GhiChu
  if (row.Ref_GPKD) m.business_license_ref = row.Ref_GPKD
  if (row.Ref_DonViCapPhuHieu) m.issuing_authority_ref = row.Ref_DonViCapPhuHieu
  if (row.Ref_Tuyen) m.route_ref = row.Ref_Tuyen
  if (row.SoPhuHieuCu) m.old_badge_number = row.SoPhuHieuCu
  if (row.LyDoCapLai) m.renewal_reason = row.LyDoCapLai
  if (row.QDThuHoi) m.revoke_decision = row.QDThuHoi
  if (row.LyDoThuHoi) m.revoke_reason = row.LyDoThuHoi
  if (row.NgayThuHoi) m.revoke_date = parseDate(row.NgayThuHoi)
  if (row.XeThayThe) m.replacement_vehicle = row.XeThayThe
  if (row.Xebithaythe) m.vehicle_replaced = row.Xebithaythe
  if (row.Hancap) m.renewal_due_date = row.Hancap
  if (row.TrangThai) m.status = row.TrangThai
  return m
}

/** Check if core fields differ */
function findDiffs(dbRow: any, csvRow: SheetRow, metadata: Record<string, string>): string[] {
  const diffs: string[] = []
  const badgeNumber = csvRow.SoPhuHieu || null
  const badgeType = csvRow.LoaiPH || null
  const issueDate = parseDate(csvRow.NgayCap)
  const expiryDate = parseDate(csvRow.NgayHetHan)
  const status = mapStatus(csvRow.TrangThai)

  if (dbRow.badgeNumber !== badgeNumber) diffs.push(`badge_number: "${dbRow.badgeNumber}" → "${badgeNumber}"`)
  if (dbRow.badgeType !== badgeType) diffs.push(`badge_type: "${dbRow.badgeType}" → "${badgeType}"`)
  if (dbRow.issueDate !== issueDate) diffs.push(`issue_date: "${dbRow.issueDate}" → "${issueDate}"`)
  if (dbRow.expiryDate !== expiryDate) diffs.push(`expiry_date: "${dbRow.expiryDate}" → "${expiryDate}"`)
  if (dbRow.status !== status) diffs.push(`status: "${dbRow.status}" → "${status}"`)

  const dbMeta = (dbRow.metadata as Record<string, string>) || {}
  for (const [key, val] of Object.entries(metadata)) {
    if (dbMeta[key] !== val) {
      diffs.push(`meta.${key}: "${dbMeta[key] || ''}" → "${val}"`)
    }
  }
  return diffs
}

// ─── Main ───

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  if (!db) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  console.log(`=== Sync vehicle_badges from Google Sheet ===`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)

  // 1. Fetch CSV
  console.log('\n[1/5] Fetching CSV from Google Sheets...')
  const res = await fetch(SHEET_CSV_URL)
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  const csvText = await res.text()
  const rows: SheetRow[] = parseCSV(csvText)
  console.log(`  Sheet: ${rows.length} rows`)

  // 2. Load DB badges
  console.log('[2/5] Loading badges from DB...')
  const dbBadges = await db!.select({
    id: vehicleBadges.id,
    firebaseId: vehicleBadges.firebaseId,
    badgeNumber: vehicleBadges.badgeNumber,
    plateNumber: vehicleBadges.plateNumber,
    badgeType: vehicleBadges.badgeType,
    issueDate: vehicleBadges.issueDate,
    expiryDate: vehicleBadges.expiryDate,
    status: vehicleBadges.status,
    isActive: vehicleBadges.isActive,
    metadata: vehicleBadges.metadata,
    vehicleId: vehicleBadges.vehicleId,
  }).from(vehicleBadges)
  console.log(`  DB: ${dbBadges.length} rows`)

  const dbMap = new Map<string, (typeof dbBadges)[0]>()
  for (const b of dbBadges) {
    if (b.firebaseId) dbMap.set(b.firebaseId, b)
  }

  // 3. Build Firebase vehicle ref → plate number lookup (for new inserts)
  console.log('[3/5] Building vehicle ref → plate lookup...')
  const vehicleMappings = await db!.select({
    firebaseId: idMappings.firebaseId,
    postgresId: idMappings.postgresId,
  }).from(idMappings).where(eq(idMappings.entityType, 'vehicles'))

  const fbToVehicleId = new Map<string, string>()
  for (const m of vehicleMappings) {
    fbToVehicleId.set(m.firebaseId, m.postgresId)
  }

  const allVehicles = await db!.select({
    id: vehicles.id,
    plateNumber: vehicles.plateNumber,
  }).from(vehicles)

  const vehicleIdToPlate = new Map<string, string>()
  for (const v of allVehicles) {
    vehicleIdToPlate.set(v.id, v.plateNumber)
  }
  console.log(`  Vehicle mappings: ${fbToVehicleId.size}, Vehicles: ${allVehicles.length}`)

  // Helper: resolve Firebase vehicle ref → { vehicleId, plateNumber }
  function resolveVehicle(fbRef: string): { vehicleId: string | null; plateNumber: string } {
    if (!fbRef) return { vehicleId: null, plateNumber: 'UNKNOWN' }
    const pgId = fbToVehicleId.get(fbRef) || null
    if (!pgId) return { vehicleId: null, plateNumber: `UNKNOWN_${fbRef}` }
    const plate = vehicleIdToPlate.get(pgId)
    return { vehicleId: pgId, plateNumber: plate || `UNKNOWN_${fbRef}` }
  }

  // 4. Compare
  console.log('[4/5] Comparing...')
  const toInsert: { row: SheetRow; vehicleId: string | null; plateNumber: string }[] = []
  const toUpdate: { id: string; row: SheetRow; diffs: string[]; existingMeta: Record<string, string> }[] = []
  const sheetIds = new Set<string>()
  let unchanged = 0

  for (const row of rows) {
    if (!row.ID_PhuHieu) continue
    sheetIds.add(row.ID_PhuHieu)
    const metadata = buildMetadata(row)
    const existing = dbMap.get(row.ID_PhuHieu)

    if (!existing) {
      const { vehicleId, plateNumber } = resolveVehicle(row.BienSoXe)
      toInsert.push({ row, vehicleId, plateNumber })
    } else {
      const diffs = findDiffs(existing, row, metadata)
      if (diffs.length > 0) {
        toUpdate.push({
          id: existing.id,
          row,
          diffs,
          existingMeta: (existing.metadata as Record<string, string>) || {},
        })
      } else {
        unchanged++
      }
    }
  }

  const orphaned = dbBadges.filter(b => b.firebaseId && !sheetIds.has(b.firebaseId))

  // Report
  console.log(`\n=== Summary ===`)
  console.log(`  Unchanged: ${unchanged}`)
  console.log(`  To insert: ${toInsert.length}`)
  console.log(`  To update: ${toUpdate.length}`)
  console.log(`  Orphaned:  ${orphaned.length} (in DB not in sheet, will NOT delete)`)

  if (toUpdate.length > 0) {
    const show = toUpdate.slice(0, 30)
    console.log(`\n--- Updates (first ${show.length}) ---`)
    for (const u of show) {
      console.log(`  [${u.row.ID_PhuHieu}] ${u.diffs.join(', ')}`)
    }
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No changes applied.')
    return
  }

  // 5. Apply
  console.log('\n[5/5] Applying changes...')

  // Inserts (one by one to skip bad rows)
  if (toInsert.length > 0) {
    console.log(`  Inserting ${toInsert.length} new badges...`)
    let inserted = 0
    let failed = 0
    for (const { row, vehicleId, plateNumber } of toInsert) {
      try {
        const status = mapStatus(row.TrangThai)
        const metadata = buildMetadata(row)
        const issueDate = parseDate(row.NgayCap)
        const expiryDate = parseDate(row.NgayHetHan)

        await db!.insert(vehicleBadges).values({
          firebaseId: row.ID_PhuHieu,
          badgeNumber: row.SoPhuHieu || null,
          plateNumber,
          vehicleId,
          badgeType: row.LoaiPH || null,
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          status,
          isActive: status === 'active',
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          source: 'sheet_sync',
          syncedAt: new Date(),
        })
        inserted++
      } catch (err: any) {
        failed++
        console.log(`    SKIP insert [${row.ID_PhuHieu}]: ${err?.cause?.message || err?.message || 'unknown'}`)
      }
      if ((inserted + failed) % 50 === 0) process.stdout.write(`    ${inserted + failed}/${toInsert.length}\r`)
    }
    console.log(`    inserted: ${inserted}, failed: ${failed}`)
  }

  // Updates (one by one — preserves plateNumber from DB)
  if (toUpdate.length > 0) {
    console.log(`  Updating ${toUpdate.length} badges...`)
    let count = 0
    let failed = 0
    for (const u of toUpdate) {
      try {
        const status = mapStatus(u.row.TrangThai)
        const newMeta = buildMetadata(u.row)
        const mergedMeta = { ...u.existingMeta, ...newMeta }

        await db!.update(vehicleBadges).set({
          // Update core fields but NOT plateNumber (already resolved in DB)
          badgeNumber: u.row.SoPhuHieu || null,
          badgeType: u.row.LoaiPH || null,
          issueDate: parseDate(u.row.NgayCap) || null,
          expiryDate: parseDate(u.row.NgayHetHan) || null,
          status,
          isActive: status === 'active',
          metadata: mergedMeta,
          source: 'sheet_sync',
          syncedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(vehicleBadges.id, u.id))
        count++
      } catch (err: any) {
        failed++
        console.log(`    SKIP update [${u.row.ID_PhuHieu}]: ${err?.cause?.message || err?.message || 'unknown'}`)
      }
      if ((count + failed) % 500 === 0) process.stdout.write(`    ${count + failed}/${toUpdate.length}\r`)
    }
    console.log(`    updated: ${count}, failed: ${failed}`)
  }

  console.log(`\nDone!`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
