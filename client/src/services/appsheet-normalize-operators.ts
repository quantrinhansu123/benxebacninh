/**
 * Normalize raw AppSheet THONGTINDONVIVANTAI (operator) rows
 * Column names based on ETL + AppSheet table structure
 *
 * Dedup by firebaseId — each operator is unique
 */

export interface NormalizedAppSheetOperator {
  firebaseId: string
  code: string
  name: string
  province?: string
  address?: string
  phone?: string
  taxCode?: string
  representative?: string
}

/** Safe string extraction */
const str = (val: unknown): string =>
  typeof val === 'string' ? val.trim() : ''

export function normalizeOperatorRows(
  rows: Record<string, unknown>[],
): NormalizedAppSheetOperator[] {
  const byId = new Map<string, NormalizedAppSheetOperator>()

  for (const row of rows) {
    // Try multiple possible ID field names
    const id = str(row['_RowNumber'] ?? row['ID'] ?? row['IDDonVi'] ?? row['ID_DonVi'])
    const name = str(row['TenDonVi'] ?? row['TENDV'] ?? row['TenDV'])
    if (!name) continue

    const code = str(row['MaDonVi'] ?? row['MaDV']) || id

    const normalized: NormalizedAppSheetOperator = {
      firebaseId: id,
      code: code || `OP_${id}`,
      name,
      province: str(row['TinhTP'] ?? row['Tinh']) || undefined,
      address: str(row['DiaChi']) || undefined,
      phone: str(row['DienThoai'] ?? row['SDT']) || undefined,
      taxCode: str(row['MaSoThue'] ?? row['MST']) || undefined,
      representative: str(row['NguoiDaiDien']) || undefined,
    }
    byId.set(id || code, normalized)
  }

  return Array.from(byId.values())
}
