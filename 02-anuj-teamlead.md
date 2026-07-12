# Prompt: Anuj — Team Lead / Foundation + Trip Lifecycle

You are Anuj, team lead and developer on the **TransitOps** hackathon build. You own the riskiest and most depended-on part of the system: authentication/RBAC and the trip dispatch lifecycle. Everyone else's work assumes yours exists, so build in this order and unblock the others fast.

Repo and schema are already scaffolded (see the monorepo-init task) — pull latest before starting.

## Your scope

1. Auth: login endpoint, JWT issuance/verification, RBAC middleware
2. Seed script (all edge-case data)
3. Trip lifecycle service layer: dispatch / complete / cancel
4. Two screens: **Login** and **Trip Dispatcher**

## 1. Auth & RBAC (build first — everyone waits on this)

- `POST /auth/login` — accepts email + password (+ role, see note below), verifies bcrypt hash, returns a JWT.
- Track failed login attempts per user; after 5 consecutive failures, lock the account and return a distinct "account locked" error (not the same message as "invalid credentials").
- `verifyToken` middleware: validates JWT, attaches `req.user = { id, role }`.
- `requireRole(...roles)` middleware: rejects with 403 if `req.user.role` isn't in the allowed list.
- Implement this exact permission matrix as the source of truth for which role can hit which resource:

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics |
|---|---|---|---|---|---|
| Fleet Manager | ✓ | ✓ | – | ✓ | ✓ |
| Dispatcher | View | – | ✓ | – | – |
| Safety Officer | – | ✓ | View | – | – |
| Financial Analyst | View | – | – | ✓ | ✓ |

> Note on the mockup: the login screen has a **role select dropdown** in addition to email/password. Decide with the team whether this is just a demo convenience (account still has one fixed role, dropdown is cosmetic) or whether accounts can genuinely hold multiple roles. Default to the simpler option (fixed role per account, dropdown pre-filled/disabled) unless someone objects — flag this decision in your PR description either way.

## 2. Seed script

Fill in `apps/api/src/prisma/seed.ts` with data that demonstrates every edge case without manual setup during the demo:

- 4+ vehicles: one AVAILABLE, one ON_TRIP, one IN_SHOP, one RETIRED
- 4+ drivers: one AVAILABLE, one with an EXPIRED license, one SUSPENDED, one ON_TRIP
- 1–2 users per role (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) with known passwords for demo login
- A few COMPLETED trips with linked fuel logs and maintenance records so Ahmed's and Vivek's reports have real numbers to chart before they're done building their own data-entry screens

Push this early — Tirth, Ahmed, and Vivek all need seeded data to build against.

## 3. Trip lifecycle service layer

Do NOT put this logic in route handlers — one function per transition in `services/tripService.ts`, each wrapped in a single Prisma `$transaction` so a partial failure never leaves a vehicle/driver stuck in the wrong status:

- `dispatchTrip(tripId)`
  - Require: vehicle.status === AVAILABLE, driver.status === AVAILABLE, driver.licenseExpiry > now, driver.status !== SUSPENDED, cargoWeight ≤ vehicle.maxLoadKg
  - Effect: vehicle.status → ON_TRIP, driver.status → ON_TRIP, trip.status → DISPATCHED
- `completeTrip(tripId, finalOdometer, fuelConsumed)`
  - Effect: vehicle.status → AVAILABLE, driver.status → AVAILABLE, vehicle.odometer = finalOdometer, trip.status → COMPLETED
- `cancelTrip(tripId)`
  - Only valid if trip.status === DISPATCHED
  - Effect: vehicle.status → AVAILABLE, driver.status → AVAILABLE, trip.status → CANCELLED

Routes: `POST /trips`, `POST /trips/:id/dispatch`, `POST /trips/:id/complete`, `POST /trips/:id/cancel`, `GET /trips`.

Hard constraints to enforce server-side (never trust the frontend):
- A vehicle or driver already ON_TRIP cannot be assigned to a second trip
- cargoWeight must not exceed vehicle.maxLoadKg — reject with the exact numbers (capacity, cargo weight, amount exceeded) so the frontend validation box can show them verbatim

## 4. Dependency you need from Tirth

Your trip-create form needs `GET /vehicles/available` and `GET /drivers/available` (server-filtered: vehicles AVAILABLE only; drivers AVAILABLE + license valid + not suspended). These are Tirth's endpoints — coordinate the response shape early (hour 1) so you're not blocked. If Tirth isn't ready yet, stub them yourself temporarily and swap later.

## 5. Screens you own

### Login (screen 0)
```
Split-screen layout. LEFT: light/cream panel (#F5F1EA — the one exception to the dark theme), TransitOps logo + tagline "Smart Transport Operations Platform", "One login, four roles:" bulleted list (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst), footer "TRANSITOPS © 2026 · RBAC BASE".

RIGHT: dark panel. "Sign in to your account" heading, "Enter your credentials to continue" subtext. Fields: EMAIL (placeholder "rohan.k@transitops.io"), PASSWORD, ROLE SELECT dropdown (default "Dispatcher"). Row: "Remember me" checkbox + "Forgot password?" link. Full-width orange "Sign In" button. Below it, small text mapping each role to its destination:
"Fleet Manager → Fleet, Maintenance"
"Dispatcher → Dashboard, Trips"
"Safety Officer → Drivers, Compliance"
"Financial Analyst → Fuel & Expenses, Analytics"

ERROR STATE: red/pink alert above the button — "Invalid credentials" / "Account locked after 5 failed attempts", switching to the locked variant and disabling Sign In after 5 failures.
```

### Trip Dispatcher (screen 4, sidebar label "Trips")
```
Two-column layout. LEFT (~45%): lifecycle stepper "Draft → Dispatched → Completed → Cancelled" (current stage highlighted). Below it, CREATE TRIP form: SOURCE, DESTINATION (text inputs), VEHICLE dropdown sourced from /vehicles/available showing capacity inline ("VAN-05 — 500 kg capacity"), DRIVER dropdown sourced from /drivers/available, CARGO WEIGHT (kg), PLANNED DISTANCE (km). When cargo exceeds capacity, show a red bordered validation box: "Vehicle Capacity: 500 kg" / "Cargo Weight: 700 kg" / "✗ Capacity exceeded by 200 kg — dispatch blocked", and disable the orange "Dispatch" button (Cancel stays enabled, red outline).

RIGHT (~55%): "LIVE BOARD" — stacked trip cards showing route, vehicle/driver pair, status badge, ETA/note, updating live as trips move through the lifecycle.

Footer note: "On Complete: odometer + fuel + expense → Vehicle & Driver Available."
```

Use the shared design system (dark theme, amber #D68910 accent, status colors: green/blue/orange/red for Available-Completed/OnTrip-Dispatched/InShop-Suspended/Retired-Cancelled) that the monorepo scaffold already wired into Sidebar/TopBar.

## 6. Acceptance test — this must work before you call your part done

1. Register vehicle 'Van-05', maxLoadKg = 500, status = Available
2. Register driver 'Alex' with a valid license
3. Create a trip, cargoWeight = 450 → dispatch succeeds (450 ≤ 500)
4. Vehicle and driver both flip to ON_TRIP automatically
5. Complete the trip with final odometer + fuel consumed → both flip back to AVAILABLE

This is the core demo script the whole team will run live — treat it as your definition of done, not just a nice-to-have test.
