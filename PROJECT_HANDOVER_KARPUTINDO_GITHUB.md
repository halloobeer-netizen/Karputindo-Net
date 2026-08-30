# PROJECT HANDOVER — KARPUTINDO.NET (GITHUB-BASED)

## Repository
- Repository: `halloobeer-netizen/karputindo-net`
- Branch: `main`
- Project: Karputindo.net
- Type: Full-stack ISP customer management & mapping platform

## Source of Truth
This handover is based on the current GitHub repository. The repository and production database are the source of truth. Do not rebuild from scratch.

## Verified Stack
- Next.js 16
- React 19
- TypeScript
- Prisma 6.11.x
- PostgreSQL via `DATABASE_URL`
- NextAuth
- Tailwind CSS 4
- Radix UI
- Lucide React
- Leaflet / React Leaflet
- XLSX
- TanStack Table / React Query
- Zustand
- Zod
- React Hook Form
- Recharts
- Vercel deployment config present

## Repository Structure
Important root files/directories:
- `README.md`
- `package.json`
- `next.config.ts`
- `vercel.json`
- `prisma/`
- `src/`
- `public/`
- `tailwind.config.ts`
- `components.json`

## Verified Database Models
Current Prisma schema contains:

### User
Fields include:
- id
- name
- email
- passwordHash
- role
- audit logs
- customer create/update relations
- import history

### InternetPackage
Fields include:
- name
- speed
- price
- description
- status

### Customer
Important fields include:
- customerNumber
- fullName
- phone1 / phone2
- email
- address
- latitude / longitude
- packageId
- packageExcel
- registrationFee
- sales
- media
- technician
- spkNumber / spkDate
- installationDate
- terminationDate
- status
- dueDay
- gracePeriod
- serviceStatus
- pppoeUsername
- notes

### Invoice
Fields include:
- customerId
- period
- amount
- dueDate
- status
- paidAt
- notes

Unique constraint:
- customer + period

### AuditLog
Tracks:
- user
- action
- entity
- entityId
- createdAt

### ImportHistory
Tracks Excel import metrics:
- filename
- totalRows
- validRows
- importedRows
- skippedRows
- duplicateRows
- failedRows
- importedBy
- status

## Product Direction
README identifies the platform as:
- customer database management
- customer status tracking
- interactive customer mapping
- internet package management
- Excel data import
- admin dashboard and reporting
- protected admin access
- responsive interface

## Important Existing ISP/Billing Data
The current schema already supports ISP operational expansion through:
- `dueDay`
- `gracePeriod`
- `serviceStatus`
- `pppoeUsername`
- `Invoice`

Do not duplicate these concepts in new tables unless there is a clear architectural reason.

## Mapping
Current stack includes:
- Leaflet
- React Leaflet
- React Leaflet Cluster

Preserve customer latitude/longitude compatibility.

## Authentication
NextAuth is installed and the README states protected administrative access.

Before modifying auth:
1. Audit current NextAuth config.
2. Audit password/user flow.
3. Check middleware or protected routes.
4. Do not replace auth unless explicitly requested.

## Database Safety
Important package scripts include destructive commands such as:
- `db:push` with `--accept-data-loss`
- `db:reset`

NEVER run these against production without explicit approval.

Do not:
- reset database
- delete customers
- drop invoice data
- overwrite customer numbers
- destroy import history

## Billing Direction
The current schema already has `Invoice` and customer service-related fields.

Before implementing or changing billing:
1. Audit existing API/routes/components.
2. Verify how invoice status is generated.
3. Verify serviceStatus transitions.
4. Verify dueDay/gracePeriod behavior.
5. Preserve existing invoice unique constraints.

## MikroTik / PPPoE Direction
The schema contains `pppoeUsername`, meaning the database is already prepared for customer-to-PPPoE mapping.

Do not assume real MikroTik integration is complete solely because this field exists.

Before working on MikroTik:
- search source for `mikrotik`, `routeros`, `pppoe`, `isolate`, `sync`
- identify actual implementation
- separate database readiness from real router integration

## Excel Import
XLSX is installed and ImportHistory exists.

Preserve:
- import metrics
- duplicate handling
- failed row handling
- importedBy attribution

Avoid blind bulk overwrite.

## Development Rules
- Do not restart the project.
- Do not upgrade major framework versions without reason.
- Do not migrate Prisma versions casually.
- Do not replace database provider unless explicitly requested.
- Make smallest safe changes.
- Preserve customer and billing data.

## Mandatory Audit for Next AI
Before coding, report:

1. Current `src/` structure
2. Next.js routing architecture
3. Authentication implementation
4. Prisma connection implementation
5. Customer CRUD
6. Package CRUD
7. Billing/invoice implementation
8. Excel import implementation
9. Mapping implementation
10. Dashboard/reporting
11. Existing MikroTik-related code
12. API routes
13. Current build status
14. Current production/deployment risks
15. Recommended smallest safe next step

## Locked Principles
- Next.js + React + TypeScript architecture is current.
- Prisma/PostgreSQL is current database architecture.
- Customer mapping is a core feature.
- Excel import is a core feature.
- Customer billing data is already modeled.
- PPPoE username belongs to customer data.
- Never destroy production customer/invoice data.
- Repository + current DB are the source of truth.

## Correct Continuation Flow

READ REPO
→ AUDIT SRC
→ AUDIT PRISMA
→ AUDIT AUTH
→ AUDIT CUSTOMER CRUD
→ AUDIT BILLING
→ AUDIT MAPPING
→ VERIFY BUILD
→ FIX SMALLEST ISSUE
→ TEST
→ COMMIT
→ DEPLOY

Do not rebuild everything.
