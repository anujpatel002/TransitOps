# Prompt: Ahmed — Maintenance, Fuel/Expense, Dashboard KPIs

You are Ahmed, developer on the **TransitOps** hackathon build. You own three connected pieces: maintenance workflow, fuel/expense logging, and the dashboard KPI aggregation — all three read from the same vehicle-status data, which is why they're grouped together.

Repo and schema are already scaffolded (see monorepo-init task) — pull latest before starting.

## Your scope

1. Maintenance service layer + endpoints
2. Fuel log + expense endpoints
3. Dashboard KPI aggregation endpoint
4. Three screens: **Dashboard**, **Maintenance**, **Fuel & Expense Management**

## 1. Maintenance service layer

Build in `services/maintenanceService.ts`, wrapped in a Prisma transaction:

- `createMaintenance(vehicleId, desc, cost)`
  - Effect: creates an active `MaintenanceLog`, sets `vehicle.status → IN_SHOP`
- `closeMaintenance(logId)`
  - Effect: sets `closedAt`, sets `vehicle.status → AVAILABLE` **unless** `vehicle.status === RETIRED`

Routes: `POST /maintenance`, `POST /maintenance/:id/close`.

Hard rule: creating a maintenance record must immediately remove the vehicle from Tirth's `/vehicles/available` endpoint — verify this end to end, it's one of the spec's explicit business rules.

## 2. Fuel & expense endpoints

```
POST /fuel-logs     — { vehicleId, liters, cost, date }
POST /expenses       — { vehicleId, type, amount, date }  (type: toll, misc, etc.)
```

Also expose a way to compute **total operational cost per vehicle** (fuel + maintenance cost summed) — either a dedicated endpoint or a field on `GET /vehicles/:id` — Vivek's reports screen and your own Fuel & Expenses screen both need this number.

## 3. Dashboard KPI endpoint

```
GET /dashboard/kpis   — supports ?type=&status=&region= filters
```

Returns: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization % (all as simple counts/aggregates over the current DB state — no need for anything fancier than SQL/Prisma aggregate queries).

## 4. Screens you own

### Dashboard (screen 1)
```
Filter row: VEHICLE TYPE / STATUS / REGION dropdowns, all default "All".

KPI row: 7 equal-width cards, each with a colored left border and a large number:
- ACTIVE VEHICLES — e.g. 53 (green)
- AVAILABLE VEHICLES — e.g. 42 (green)
- VEHICLES IN MAINTENANCE — e.g. 05 (orange)
- ACTIVE TRIPS — e.g. 18 (blue)
- PENDING TRIPS — e.g. 09 (blue)
- DRIVERS ON DUTY — e.g. 26 (blue)
- FLEET UTILIZATION — e.g. 81% (green)

Below, two-column row. LEFT (~65%): "RECENT TRIPS" table — TRIP, VEHICLE, DRIVER, STATUS (badge), ETA. RIGHT (~35%): "VEHICLE STATUS" — four horizontal proportion bars for Available / On Trip / In Shop / Retired.

This is the screen judges see first — keep it visually clean even though the underlying logic is just counts.
```

### Maintenance (screen 5)
```
Two-column layout. LEFT (~35%): "LOG SERVICE RECORD" form — VEHICLE, SERVICE TYPE, COST, DATE, STATUS, full-width orange "Save" button. RIGHT (~65%): "SERVICE LOG" table — VEHICLE, SERVICE, COST, STATUS (badge).

Sample rows:
- VAN-05 | Oil Change | 2,500 | In Shop (orange)
- TRUCK-9 | Engine Repair | 18,000 | Completed (green)
- MINI-03 | Tyre Replace | 6,200 | In Shop (orange)

Below both columns, a small state-transition diagram: "Available" → (creating active record) → "In Shop", and "In Shop" → (closing last service) → "Available".

Footer note: "In Shop vehicles are removed from the dispatch pool."
```

### Fuel & Expense Management (screen 6)
```
"FUEL LOGS" card: VEHICLE, DATE, LITERS, COST columns, "+ Log Fuel" and "+ Add Expense" buttons top right.

Sample rows:
- VAN-05 | 05 Jul 2026 | 42 L | 3,150
- TRUCK-9 | 06 Jul 2026 | 80 L | 7,400
- MINI-03 | 06 Jul 2026 | 28 L | 2,050

"OTHER EXPENSES (TOLL / MISC)" card below: TRIP, VEHICLE, TOLL, OTHER, MAINT. LINKED, TOTAL, STATUS (badge).

Bottom: highlighted summary — "TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINT." next to a large bold orange computed number. Never let this be manually entered — always derived from the fuel + maintenance data.
```

Use the shared design system already wired into Sidebar/TopBar: dark theme, amber #D68910 accent, status colors (green/blue/orange/red for Available-Completed / OnTrip-Dispatched / InShop-Suspended / Retired-Cancelled).

## 5. Coordination notes

- Your maintenance status flip depends on Tirth's vehicle PATCH endpoint (or you own that mutation directly against the Vehicle model — agree with Tirth which of you owns the actual DB write so you don't both build it).
- Vivek's ROI/cost reports depend on your operational-cost calculation — expose it as early as possible even if the UI around it isn't finished.
- Test the "In Shop disappears from dispatch pool" rule against Anuj's trip dispatcher live, since it crosses both your work.
