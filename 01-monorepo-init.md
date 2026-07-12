# Prompt: Initialize TransitOps Monorepo

You are scaffolding the initial repository for **TransitOps**, a fleet-ops platform being built by a 4-person team in an 8-hour hackathon. Your job is ONLY to set up the skeleton so all four developers can start pushing feature code within the first hour — do not implement business logic yet.

## Stack

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Recharts
- **Backend:** Node.js + Express + TypeScript
- **ORM/DB:** Prisma + PostgreSQL (fall back to SQLite if Postgres isn't available locally — keep the schema portable)
- **Auth:** JWT (access token only), bcrypt for password hashing

## 1. Repo structure

Create a monorepo with this layout (use npm/pnpm workspaces, whichever is faster to set up):

```
transitops/
├── apps/
│   ├── api/                 # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── middleware/  # auth.ts, requireRole.ts, errorHandler.ts
│   │   │   ├── routes/      # one file per resource: vehicles.ts, drivers.ts, trips.ts, maintenance.ts, fuel.ts, expenses.ts, reports.ts, dashboard.ts, auth.ts
│   │   │   ├── services/    # business-logic layer, one file per domain: tripService.ts, maintenanceService.ts, vehicleService.ts, driverService.ts, reportService.ts
│   │   │   └── prisma/
│   │   │       ├── schema.prisma
│   │   │       └── seed.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── pages/       # one folder per screen: Login/, Dashboard/, Fleet/, Drivers/, Trips/, Maintenance/, FuelExpenses/, Analytics/, Settings/
│       │   ├── components/  # shared: Sidebar, TopBar, StatusBadge, KpiCard, DataTable
│       │   ├── api/         # typed API client functions (one file per resource, mirrors backend routes/)
│       │   ├── lib/         # auth context, query client setup
│       │   └── App.tsx
│       ├── package.json
│       └── tsconfig.json
├── package.json              # workspace root
├── .env.example
├── .gitignore
└── README.md
```

## 2. Prisma schema — create this exactly, then run the initial migration

```prisma
enum Role          { FLEET_MANAGER DISPATCHER SAFETY_OFFICER FINANCIAL_ANALYST }
enum VehicleStatus { AVAILABLE ON_TRIP IN_SHOP RETIRED }
enum DriverStatus  { AVAILABLE ON_TRIP OFF_DUTY SUSPENDED }
enum TripStatus    { DRAFT DISPATCHED COMPLETED CANCELLED }

model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
  role     Role
}

model Vehicle {
  id              String @id @default(uuid())
  regNumber       String @unique
  name            String
  type            String
  maxLoadKg       Float
  odometer        Float  @default(0)
  acquisitionCost Float
  status          VehicleStatus @default(AVAILABLE)
  trips           Trip[]
  maintenance     MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]
}

model Driver {
  id              String @id @default(uuid())
  name            String
  licenseNumber   String
  licenseCategory String
  licenseExpiry   DateTime
  contact         String
  safetyScore     Float @default(100)
  status          DriverStatus @default(AVAILABLE)
  trips           Trip[]
}

model Trip {
  id            String @id @default(uuid())
  source        String
  destination   String
  vehicleId     String
  driverId      String
  cargoWeight   Float
  plannedDist   Float
  finalOdometer Float?
  fuelConsumed  Float?
  status        TripStatus @default(DRAFT)
  createdAt     DateTime @default(now())
  vehicle       Vehicle @relation(fields:[vehicleId], references:[id])
  driver        Driver  @relation(fields:[driverId], references:[id])
}

model MaintenanceLog {
  id        String @id @default(uuid())
  vehicleId String
  desc      String
  cost      Float
  active    Boolean @default(true)
  createdAt DateTime @default(now())
  closedAt  DateTime?
  vehicle   Vehicle @relation(fields:[vehicleId], references:[id])
}

model FuelLog {
  id        String @id @default(uuid())
  vehicleId String
  liters    Float
  cost      Float
  date      DateTime
  vehicle   Vehicle @relation(fields:[vehicleId], references:[id])
}

model Expense {
  id        String @id @default(uuid())
  vehicleId String
  type      String
  amount    Float
  date      DateTime
  vehicle   Vehicle @relation(fields:[vehicleId], references:[id])
}
```

## 3. What to wire up in this initial commit

- [ ] Workspace root `package.json` with scripts: `dev` (runs both apps concurrently), `db:migrate`, `db:seed`
- [ ] `.env.example` with `DATABASE_URL`, `JWT_SECRET`
- [ ] Express app boots on a port, has a health-check route (`GET /health`)
- [ ] Vite app boots, has React Router set up with placeholder routes for all 9 screens (empty pages are fine — just get the routing shell in place so all four devs can build inside their own page file without touching shared routing config)
- [ ] Shared `Sidebar` and `TopBar` components exist as empty/basic shells, per the design system below, so every page already renders inside the correct chrome
- [ ] JWT auth middleware exists as a stub (`verifyToken`) even if login isn't fully implemented yet
- [ ] Empty `requireRole(...roles)` middleware stub in place
- [ ] Prisma schema committed, migration run, `seed.ts` exists as an empty file ready for someone to fill in
- [ ] Push to a shared repo (GitHub) and confirm all 4 teammates can clone and run `npm install && npm run dev` with zero manual fixes

## 4. Design system reference (so the Sidebar/TopBar shells match from commit one)

```
COLORS
- App background: near-black #0A0A0A
- Panel/card background: #141414, 1px border #262626, radius 8px
- Sidebar background: #111111, right border #1F1F1F
- Primary text: #F5F5F5, muted text: #8A8A8A
- Primary accent: amber #D68910 (hover #C2760C)
- Status colors: Available/Completed = green #22C55E, On Trip/Dispatched = blue #3B82F6, In Shop/Suspended = orange #F59E0B, Retired/Cancelled = red/pink #F43F5E

LAYOUT
- Fixed left sidebar ~200px: "TransitOps" wordmark + orange square logo mark, then nav items in order: Dashboard, Fleet, Drivers, Trips, Maintenance, Fuel & Expenses, Analytics, Settings. Active item = orange left border (3px).
- Top bar: search input (left), user name + orange role badge pill (right).
- Content area: 24px padding.
```

## 5. Do NOT do in this task

- Do not implement any business rules (dispatch/complete/cancel logic, maintenance status flips, etc.) — that's each developer's own task.
- Do not build out full page content — placeholder/empty pages only.
- Do not write the RBAC permission matrix logic — just the middleware stub.

## 6. Handoff

Once this is done, immediately share: the repo URL, the `.env.example` values each teammate needs locally, and confirmation that `npm run dev` starts both apps. This unblocks all four other prompts in this set.
