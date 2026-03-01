/**
 * Normalize raw AppSheet Xe (vehicle) rows into app-compatible format
 * Column names discovered from AppSheet "Xe" table (gid=40001005)
 */

export interface NormalizedAppSheetVehicle {
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

/** Safe string extraction */
const str = (val: unknown): string =>
  typeof val === 'string' ? val.trim() : ''

/** Safe integer extraction */
const int = (val: unknown): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined
  const n = Number(val)
  return Number.isFinite(n) ? Math.floor(n) : undefined
}

export function normalizeVehicleRows(
  rows: Record<string, unknown>[],
): NormalizedAppSheetVehicle[] {
  const results: NormalizedAppSheetVehicle[] = []
  const now = new Date().toISOString()

  for (const row of rows) {
    const id = str(row['IDXe'] ?? row['_RowNumber'] ?? row['Id'])
    const plate = str(row['BienSo'] ?? row['BienKiemSoat'])

    // Skip rows without plate number (unusable)
    if (!plate) continue

    results.push({
      firebaseId: id || normPlate(plate),
      plateNumber: normPlate(plate),
      registrationName: str(row['TenDangKyXe']) || undefined,
      seatCapacity: int(row['SoChoNgoi'] ?? row['SoCho']),
      source: 'appsheet',
      syncedAt: now,
    })
  }

  return results
}
