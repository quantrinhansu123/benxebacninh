# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `./.claude/workflows/primary-workflow.md`
- Development rules: `./.claude/workflows/development-rules.md`
- Orchestration protocols: `./.claude/workflows/orchestration-protocol.md`
- Documentation management: `./.claude/workflows/documentation-management.md`
- And other workflows: `./.claude/workflows/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/workflows/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.
**IMPORTANT**: Date format is configured in `.ck.json` and injected by session hooks via `$CK_PLAN_DATE_FORMAT` env var. Use this format for plan/report naming.

## Database Schema (Drizzle ORM + Supabase PostgreSQL)

**Location:** `server/src/db/schema/`

### Core Tables (19 total)

1. **operators** - Transportation companies/operators
2. **vehicle_types** - Vehicle classifications
3. **vehicles** - Fleet registry with maintenance records
4. **vehicle_documents** - Vehicle documentation and registration
5. **vehicle_badges** - Route badges (Buýt, Tuyến cố định) with metadata
6. **drivers** - Driver profiles and qualifications
7. **driver_operators** - Many-to-many driver-operator relationships
8. **routes** - Route definitions with departure/arrival stations
9. **schedules** - Route schedules and timing
10. **locations** - Pickup/dropoff locations
11. **services** - Service type definitions
12. **shifts** - Work shift definitions
13. **dispatch_records** - Core dispatch operations (7 indexes)
14. **invoices** - Financial transactions
15. **violations** - Traffic violations and penalties
16. **users** - System users and authentication
17. **audit_logs** - System audit trail
18. **id_mappings** - Firebase-to-Supabase migration mappings

### Critical Relationships

```
operators ←--→ vehicles (operatorId FK)
operators ←--→ drivers (via driver_operators junction)
vehicles ←--→ dispatch_records (vehicleId FK)
drivers ←--→ dispatch_records (driverId FK)
routes ←--→ vehicle_badges (routeId FK)
routes ←--→ dispatch_records (routeId FK)
```

### Key Schema Notes

**vehicle_badges:**
- Fields: `routeId`, `routeCode`, `routeName`, `metadata` (JSONB)
- `metadata` contains: `badge_color`, `issue_type`, `file_number`, `route_ref`
- Route matching: Primary by `routeId` FK, fallback to `routeName` string match
- **IMPORTANT:** Backend constructs route display as `departureStation - arrivalStation`

**dispatch_records:**
- Status workflow: entered → passengers_dropped → permit_issued → paid → departure_ordered → departed → exited
- 7 indexes for query optimization
- Fields: settlement, driver settlement, fees, fuel consumption

**routes table - Normalized Fields:**
- `route_type`: MUST be one of 3 values: `"Liên tỉnh"`, `"Nội tỉnh"`, `"Xe buýt"`. Normalized in `gtvt-normalize-routes.service.ts:normalizeRouteType()`. Controller uses `isBusRouteType()` helper (checks both `"bus"` and `"xe buýt"` for backward compat).
- `operation_status`: Active statuses include "Đã công bố", "Đang khai thác", "Hoạt động", "Mới". Inactive keywords: "ngừng", "đóng", "hết hiệu lực". Frontend counts inactive first, then `active = total - inactive`.
- `departure_province`/`arrival_province`: Stored as Vietnamese text names (e.g. "Bắc Giang"), NOT numeric codes. No external province API dependency.
- `departure_station`/`arrival_station`: Plain text. Watch for UTF-8 encoding corruption from Google Sheet → Firebase → Supabase migration pipeline.

**Data Flow Patterns:**
- Backend query via Drizzle ORM → Controller mapping → Frontend service → UI state
- **CRITICAL:** Always preserve backend data fields when mapping in frontend (don't overwrite with empty defaults)
- Use normalized lookups (`.trim().toUpperCase()`) for string matching (route names, etc.)
- **3-Layer Normalization Rule:** When changing DB enum/category values, MUST update all 3 layers: (1) DB migration for existing data, (2) sync service for future data, (3) controller/helpers that hardcode old values. Always grep codebase for old string values before changing.

### Data Origin Notes (Google Sheet → Firebase → Supabase)

**Google Sheet source:** `1hh1GKMiEXKb2KBYpyvzpqYuyc1Khzfjdxv2YMfIZ7cI` (updated 2026-02-26, was `16R5NPyZ-jMPq4Jnqgjl8pbK3ScrD_8GeG0Fv4-gJQhY`)

| gid | Sheet/Tab name | Target table | Key columns |
|-----|---------------|--------------|-------------|
| `1560762265` | PHUHIEUXE | `vehicle_badges` | ID_PhuHieu |
| `40001005` | Xe | `vehicles` | IDXe, BienSo |
| `230690868` | BieuDoChayXeChiTiet | `schedules` (via join) | ID_NutChay, Ref_ThongBaoKhaiThac |
| `1033980793` | THONGBAO_KHAITHAC | `operation_notices` | ID_TB, Ref_Tuyen, Ref_DonVi |
| `2025728801` | DANHMUCTUYENBUYT | `routes` (bus) | ID_Tuyen, SoHieuTuyen |
| `328499076` | DANHMUCTUYENCODINH | `routes` (fixed) | MaSoTuyen, TinhDi, BenDi |
| `1985887920` | BIEUDOCHAY_BUYT | bus schedule diagram | ID_BieuDo |
| `1047672631` | GIOCHAY_BUYT | bus departure times | ID_GioChay |
| `415536628` | QUYETDINH_KHAITHAC_BUYT | bus operation decisions | IDQD |

**`issuing_authority` field origin:**
- **`routes` table**: Extracted from `original_info` text in sheet "Danh mục tuyến cố định". The decision number column (e.g. `1752/SGTVT-QLVT PT&NL`) was resolved client-side (Firebase app) to full authority name (e.g. `Sở Giao thông Vận tải Bắc Giang`). Data already imported via `datasheet_routes.json`.
- **`vehicle_badges` table**: Sheet PHUHIEUXE has `Ref_DonViCapPhuHieu` (reference ID only, not name). Stored in `metadata.issuing_authority_ref` JSONB, not a dedicated column.
- **`vehicle_documents` table**: Manually entered in app (e.g. "Cục Đăng kiểm Việt Nam").

**`TenDangKyXe` column (Sheet tab "Xe", gid=40001005):**
- NOT an operator name. Contains classification code (e.g. "K" = xe có KDVT).
- Stored in `vehicles.metadata.registration_name`, NOT in `operator_name`.
- `operator_name` for sheet_sync vehicles should remain NULL (resolved via operator_id FK or badge reference).

### GTVT AppSheet Integration (Sở GTVT Bắc Giang)

**AppSheet App:** SMARTTRANSPORTBG_V11_Core
**AppID:** `7ee20176-7cb1-4ad4-9d13-e541c8b1b3dc`
**API Version:** v2 (POST-based, NOT GET)

**API Endpoint Pattern:**
```
POST https://www.appsheet.com/api/v2/apps/{appId}/tables/{tableName}/Action
Header: ApplicationAccessKey: {apiKey}
Body: {"Action": "Find", "Properties": {}, "Rows": []}
```

**AppSheet Table → Sync mapping:**
| AppSheet Table | Env var endpoint | Purpose |
|---|---|---|
| `DANHMUCTUYENCODINH` | `GTVT_APPSHEET_ROUTES_ENDPOINT` | Routes (tuyến cố định) |
| `DANHMUCTUYENBUYT` | `GTVT_APPSHEET_BUS_ROUTES_ENDPOINT` | Routes (tuyến buýt) |
| `BieuDoChayXeChiTiet` | `GTVT_APPSHEET_SCHEDULES_ENDPOINT` | Schedule rows (nút chạy cố định) |
| `GIOCHAY_BUYT` | `GTVT_APPSHEET_BUS_SCHEDULES_ENDPOINT` | Schedule rows (giờ chạy buýt) |
| `THONGBAO_KHAITHAC` | `GTVT_APPSHEET_NOTIFICATIONS_ENDPOINT` | Enrichment: Ref_Tuyen, Ref_DonVi (cố định) |
| `BIEUDOCHAY_BUYT` | `GTVT_APPSHEET_BUS_LOOKUP_ENDPOINT` | Enrichment: TuyenBuyt, DonViKhaiThac (buýt) |

**Key relationship:** Both types follow same join pattern:
- **Fixed**: BieuDoChayXeChiTiet.`Ref_ThongBaoKhaiThac` → THONGBAO_KHAITHAC.`ID_TB` → get `Ref_Tuyen`, `Ref_DonVi`
- **Bus**: GIOCHAY_BUYT.`BieuDo` → BIEUDOCHAY_BUYT.`ID_BieuDo` → get `TuyenBuyt`, `DonViKhaiThac`

**Sync code:** `server/src/services/gtvt-*.ts`, `server/src/config/gtvt-appsheet.config.ts`, `server/src/controllers/gtvt-sync.controller.ts`
**Implementation plan:** `plans/260225-1643-gtvt-appsheet-api-fix-and-sync/plan.md`

### GTVT Sync Known Issues & Patterns

**Fallback ID Conflict (DANHMUCTUYENCODINH):**
- DANHMUCTUYENCODINH has no UUID field → AppSheet uses `MaSoTuyen` (route code) as fallback `firebaseId`
- When syncing, if `firebaseId === routeCode` (normalized), it's a fallback ID. Must adopt existing DB firebase_id instead of treating as conflict.
- Logic in `gtvt-route-schedule-sync.service.ts`: `existingCodeToOriginalId` map detects fallback IDs, `adoptedFirebaseIds` merged into `seenFirebaseIds` for disable logic.

**UTF-8 Encoding Corruption:**
- Data pipeline Google Sheet → Firebase → JSON export → Supabase import corrupts Vietnamese diacritics (ế→��, ạ→��, ê→��)
- Detection query: `WHERE column ~ '[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F]' OR column LIKE '%�%'`
- Fix via Supabase migration with exact string replacement. Verify by comparing with sibling records (same route prefix).
- Known fixed fields: `departure_province`, `arrival_province`, `departure_station`, `arrival_station`

**TypeScript Build (Render deploy):**
- Raw SQL results (`RowList<Record<string, unknown>[]>`) need `as unknown as Type` double cast pattern
- Pre-existing TS errors in test files/ETL migrations are non-blocking for production build

## Documentation Management

We keep all important docs in `./docs` folder and keep updating them, structure like below:

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `./CLAUDE.md`, especially *WORKFLOWS* section is *CRITICALLY IMPORTANT*, this rule is *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*