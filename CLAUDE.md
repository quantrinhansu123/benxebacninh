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

**Data Flow Patterns:**
- Backend query via Drizzle ORM → Controller mapping → Frontend service → UI state
- **CRITICAL:** Always preserve backend data fields when mapping in frontend (don't overwrite with empty defaults)
- Use normalized lookups (`.trim().toUpperCase()`) for string matching (route names, etc.)

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