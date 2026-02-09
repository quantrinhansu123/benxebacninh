/**
 * Sync vehicle_badges from Google Sheet CSV (bulk operations)
 * Usage: npx tsx sync-vehicle-badges-from-sheet.ts [--dry-run]
 */
import 'dotenv/config'
import { db } from '../../drizzle.js'
import { sql } from 'drizzle-orm'

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/16R5NPyZ-jMPq4Jnqgjl8pbK3ScrD_8GeG0Fv4-gJQhY/gviz/tq?tqx=out:csv&gid=1560762265'

interface SheetRow {
  ID_PhuHieu: string; MaHoSo: string; LoaiPH: string; SoPhuHieu: string; BienSoXe: string
  Ref_DonViCapPhuHieu: string; Ref_GPKD: string; Ref_Tuyen: string; NgayCap: string
  NgayHetHan: string; LoaiCap: string; LyDoCapLai: string; SoPhuHieuCu: string
  TrangThai: string; QDThuHoi: string; LyDoThuHoi: string; NgayThuHoi: string
  XeThayThe: string; MauPhuHieu: string; GhiChu: string; Xebithaythe: string; Hancap: string
}

/** Parse CSV (handles quoted fields with commas/escaped quotes) */
function parseCSV(text: string): SheetRow[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const parseRow = (line: string): string[] => {
    const fields: string[] = []; let current = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = '' }
      else current += ch
    }
    fields.push(current.trim())
    return fields
  }
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseRow(line), obj: any = {}
    headers.forEach((h, j) => obj[h] = vals[j] || '')
    return obj
  })
}

/** dd/MM/yyyy -> yyyy-MM-dd */
function parseDate(d: string): string | null {
  if (!d) return null
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, day, month, year] = m
  if (+month < 1 || +month > 12 || +day < 1 || +day > 31) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/** Map TrangThai -> status */
function mapStatus(s: string): string {
  if (!s) return 'active'
  const l = s.toLowerCase()
  if (l.includes('thu hồi')) return 'revoked'
  if (l.includes('hết hiệu lực') || l.includes('hết hạn')) return 'expired'
  if (l.includes('hiệu lực')) return 'active'
  return 'active'
}

/** Build metadata JSONB */
function buildMeta(r: SheetRow): Record<string, string> {
  const m: Record<string, string> = {}
  if (r.LoaiPH) m.badge_type = r.LoaiPH
  if (r.MaHoSo) m.file_number = r.MaHoSo
  if (r.LoaiCap) m.issue_type = r.LoaiCap
  if (r.MauPhuHieu) m.badge_color = r.MauPhuHieu
  if (r.GhiChu) m.notes = r.GhiChu
  if (r.Ref_GPKD) m.business_license_ref = r.Ref_GPKD
  if (r.Ref_DonViCapPhuHieu) m.issuing_authority_ref = r.Ref_DonViCapPhuHieu
  if (r.Ref_Tuyen) m.route_ref = r.Ref_Tuyen
  if (r.SoPhuHieuCu) m.old_badge_number = r.SoPhuHieuCu
  if (r.LyDoCapLai) m.renewal_reason = r.LyDoCapLai
  if (r.QDThuHoi) m.revoke_decision = r.QDThuHoi
  if (r.LyDoThuHoi) m.revoke_reason = r.LyDoThuHoi
  const rd = parseDate(r.NgayThuHoi); if (rd) m.revoke_date = rd
  if (r.XeThayThe) m.replacement_vehicle = r.XeThayThe
  if (r.Xebithaythe) m.vehicle_replaced = r.Xebithaythe
  if (r.Hancap) m.renewal_due_date = r.Hancap
  if (r.TrangThai) m.status = r.TrangThai
  return m
}

/** Escape string for SQL literal */
const esc = (s: string | null): string => s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (!db) { console.error('DATABASE_URL not set'); process.exit(1) }
  console.log(`=== Sync vehicle_badges (bulk) ===\nMode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)

  // 1. Fetch CSV
  console.log('\n[1/4] Fetching CSV...')
  const res = await fetch(SHEET_CSV_URL)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const rows = parseCSV(await res.text()).filter(r => r.ID_PhuHieu)
  console.log(`  Rows: ${rows.length}`)

  // 2. Create temp table & insert all data
  console.log('[2/4] Creating temp table...')
  await db.execute(sql.raw(`DROP TABLE IF EXISTS _tmp_badges`))
  await db.execute(sql.raw(`
    CREATE TEMP TABLE _tmp_badges (
      firebase_id TEXT PRIMARY KEY, badge_number TEXT, badge_type TEXT,
      issue_date TEXT, expiry_date TEXT, status TEXT, is_active BOOLEAN,
      metadata JSONB, vehicle_fb_ref TEXT
    )
  `))

  // Build VALUES for batch insert (chunks of 500)
  const CHUNK = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const values = chunk.map(r => {
      const status = mapStatus(r.TrangThai)
      const meta = buildMeta(r)
      return `(${esc(r.ID_PhuHieu)},${esc(r.SoPhuHieu || null)},${esc(r.LoaiPH || null)},` +
        `${esc(parseDate(r.NgayCap))},${esc(parseDate(r.NgayHetHan))},${esc(status)},` +
        `${status === 'active'},${esc(JSON.stringify(meta))},${esc(r.BienSoXe || null)})`
    }).join(',')
    await db.execute(sql.raw(`INSERT INTO _tmp_badges VALUES ${values}`))
    inserted += chunk.length
  }
  console.log(`  Inserted ${inserted} rows into temp table`)

  // 3. Bulk UPDATE existing records (do NOT overwrite plate_number)
  console.log('[3/4] Bulk update...')
  const updateSql = `
    UPDATE vehicle_badges vb SET
      badge_number = t.badge_number,
      badge_type = t.badge_type,
      issue_date = NULLIF(t.issue_date, '')::date,
      expiry_date = NULLIF(t.expiry_date, '')::date,
      status = t.status,
      is_active = t.is_active,
      metadata = COALESCE(vb.metadata, '{}'::jsonb) || t.metadata,
      source = 'sheet_sync',
      synced_at = NOW(),
      updated_at = NOW()
    FROM _tmp_badges t
    WHERE vb.firebase_id = t.firebase_id
  `
  if (isDryRun) {
    const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as cnt FROM vehicle_badges vb JOIN _tmp_badges t ON vb.firebase_id = t.firebase_id`))
    console.log(`  [DRY] Would update: ${(countRes as any)[0]?.cnt || 0}`)
  } else {
    const upd = await db.execute(sql.raw(updateSql))
    console.log(`  Updated: ${(upd as any).count ?? 'ok'}`)
  }

  // 4. Bulk INSERT new records (resolve plate via id_mappings->vehicles)
  console.log('[4/4] Bulk insert new...')
  const insertSql = `
    INSERT INTO vehicle_badges (
      firebase_id, badge_number, plate_number, vehicle_id, badge_type,
      issue_date, expiry_date, status, is_active, metadata, source, synced_at, created_at, updated_at
    )
    SELECT
      t.firebase_id, t.badge_number,
      COALESCE(v.plate_number, 'UNKNOWN_' || COALESCE(t.vehicle_fb_ref, 'NONE')),
      im.postgres_id::uuid,
      t.badge_type, NULLIF(t.issue_date, '')::date, NULLIF(t.expiry_date, '')::date, t.status, t.is_active,
      t.metadata, 'sheet_sync', NOW(), NOW(), NOW()
    FROM _tmp_badges t
    LEFT JOIN id_mappings im ON im.firebase_id = t.vehicle_fb_ref AND im.entity_type = 'vehicles'
    LEFT JOIN vehicles v ON v.id = im.postgres_id::uuid
    WHERE NOT EXISTS (SELECT 1 FROM vehicle_badges vb WHERE vb.firebase_id = t.firebase_id)
  `
  if (isDryRun) {
    const countRes = await db.execute(sql.raw(`SELECT COUNT(*) as cnt FROM _tmp_badges t WHERE NOT EXISTS (SELECT 1 FROM vehicle_badges vb WHERE vb.firebase_id = t.firebase_id)`))
    console.log(`  [DRY] Would insert: ${(countRes as any)[0]?.cnt || 0}`)
  } else {
    const ins = await db.execute(sql.raw(insertSql))
    console.log(`  Inserted: ${(ins as any).count ?? 'ok'}`)
  }

  // Cleanup
  await db.execute(sql.raw(`DROP TABLE IF EXISTS _tmp_badges`))

  // Summary
  const total = await db.execute(sql.raw(`SELECT COUNT(*) as cnt FROM vehicle_badges`))
  console.log(`\nDone! Total badges in DB: ${(total as any)[0]?.cnt}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
