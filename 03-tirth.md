# Prompt: Tirth — Vehicle & Driver Management

You are Tirth, developer on the **TransitOps** hackathon build. You own the Vehicle Registry and Drivers screens end to end — backend CRUD plus frontend. Your `/vehicles/available` and `/drivers/available` endpoints are a hard dependency for Anuj's trip dispatcher, so build and expose those early even before the full CRUD UI is polished.

Repo and schema are already scaffolded (see monorepo-init task) — pull latest before starting.

## Your scope

1. Vehicle CRUD (backend + frontend)
2. Driver CRUD (backend + frontend)
3. The server-filtered "available" endpoints Anuj depends on
4. Two screens: **Vehicle Registry** and **Drivers & Safety Profiles**

## 1. Vehicle endpoints

```
GET    /vehicles                 — full list, supports ?type=&status= filters
GET    /vehicles/available       — server-filtered: status === AVAILABLE only. PRIORITIZE THIS — Anuj needs it hour 1.
POST   /vehicles                 — create, enforce regNumber uniqueness (reject with a clear error, not a generic 500)
PATCH  /vehicles/:id             — update any field including status
```

Vehicle fields: `regNumber` (unique), `name`, `type`, `maxLoadKg`, `odometer`, `acquisitionCost`, `status` (AVAILABLE / ON_TRIP / IN_SHOP / RETIRED).

Hard rule: retired or in-shop vehicles must never appear in `/vehicles/available` — this is what keeps them out of Anuj's trip dispatcher, so double check the filter before handing it off.

## 2. Driver endpoints

```
GET    /drivers                  — full list
GET    /drivers/available        — server-filtered: status === AVAILABLE AND licenseExpiry > now AND status !== SUSPENDED. PRIORITIZE THIS TOO.
POST   /drivers                  — create
PATCH  /drivers/:id              — update any field including status
```

Driver fields: `name`, `licenseNumber`, `licenseCategory`, `licenseExpiry`, `contact`, `safetyScore`, `status` (AVAILABLE / ON_TRIP / OFF_DUTY / SUSPENDED).

Hard rule: expired-license or suspended drivers must never appear in `/drivers/available`.

## 3. Screens you own

### Vehicle Registry (screen 2, sidebar label "Fleet")
```
Toolbar: TYPE filter dropdown (default "All"), STATUS filter dropdown (default "All"), search input (placeholder "Search reg. no..."), orange "+ Add Vehicle" button top right.

Table columns: REG. NO. / CHASSIS | NAME/MODEL | TYPE | CAPACITY | ODOMETER | ACQ. COST | STATUS (colored pill badge).

Sample data to build against:
- GJ01AB1234 | VAN-05 | Van | 500 kg | 74,000 | 6,20,000 | Available (green)
- GJ01BC5678 | TRUCK-9 | Truck | 5 Ton | 182,000 | 24,50,000 | On Trip (blue)
- GJ01CD9012 | MINI-03 | Mini | 1 Ton | 66,000 | 4,10,000 | In Shop (orange)
- GJ01DE3456 | VAN-09 | Van | 750 kg | 249,400 | 5,90,000 | Retired (red)

Footer text below the table, small orange/muted italic: "Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher." — render as persistent visible text.

"+ Add Vehicle" opens a modal: Registration Number (validated unique — surface the backend's uniqueness error inline), Name/Model, Type (select), Max Load Capacity (kg), Odometer, Acquisition Cost, Status (select).
```

### Drivers & Safety Profiles (screen 3, sidebar label "Drivers")
```
Toolbar: search input, orange "+ Add Driver" button.

Table columns: DRIVER | LICENSE NO. | CATEGORY | EXPIRY | CONTACT | TRIP COMPL. | SAFETY | STATUS (badge).

Sample data:
- Alex | DL-99213 | LMV | 12/2027 | 98765xxxxx | 96% | Available
- John | DL-44120 | HMV | 05/2025 (EXPIRED — render in red text) | 92220xxxxx | 89% | Suspended
- Priya | DL-77031 | LMV | 08/2026 | 99180xxxxx | 94% | On Trip
- Suresh | DL-10045 | HMV | 01/2027 | 93440xxxxx | 88% | Off Duty

Below the table: small legend row with the four status chips (Available/On Trip/Off Duty/Suspended) as a color key.

Footer text: "Rule: Expired license or Suspended status → blocked from Trip assignment."

"+ Add Driver" opens a modal: Name, License Number, License Category (select), License Expiry Date (date picker), Contact Number, Safety Score, Status (select).
```

Use the shared design system already wired into Sidebar/TopBar: dark theme, amber #D68910 accent, status colors (green = Available, blue = On Trip, orange = In Shop/Suspended, red = Retired).

## 4. Coordination notes

- Ping Anuj as soon as `/vehicles/available` and `/drivers/available` exist, even before the CRUD UI is done — his trip dispatcher is blocked without them.
- Ahmed's maintenance screen will call `PATCH /vehicles/:id` (or a dedicated maintenance endpoint that internally updates vehicle status) to flip a vehicle to IN_SHOP — make sure your PATCH endpoint accepts a status-only update cleanly.
- Test the uniqueness constraint and the expired-license filter explicitly — these are the two rules judges are most likely to probe live.
