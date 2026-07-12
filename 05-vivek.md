# Prompt: Vivek — Reports, Analytics, CSV Export, Settings

You are Vivek, developer on the **TransitOps** hackathon build. You own the analytics/reporting layer and the CSV export, plus the Settings/RBAC reference screen. Because your work depends on data others are producing, start with the calculation logic against seeded data before the UI is ready — don't wait idle for teammates to finish their screens.

Repo and schema are already scaffolded (see monorepo-init task) — pull latest before starting.

## Your scope

1. Report calculation endpoints
2. CSV export
3. Two screens: **Reports & Analytics** and **Settings & RBAC**
4. Team demo script + final polish pass (last hour — see section 5)

## 1. Report endpoints

```
GET /reports/fuel-efficiency   — distance / fuel per vehicle
GET /reports/utilization       — fleet utilization % (can reuse Ahmed's dashboard KPI logic)
GET /reports/cost              — fuel + maintenance total per vehicle (Ahmed exposes the underlying number — confirm the exact endpoint/shape with him early)
GET /reports/roi               — (Revenue - (Maintenance + Fuel)) / AcquisitionCost, per vehicle
GET /reports/export.csv        — streams the report data as CSV
```

Start writing these against Anuj's seed data (hour 1–2) using direct Prisma queries — you don't need anyone else's endpoints finished to compute correct numbers from the raw tables, you just need the seed to exist.

Note on ROI: the spec doesn't define "Revenue" elsewhere in the requirements — agree with the team on a simple source for it (e.g. a flat per-trip revenue field you seed, or a placeholder formula) rather than guessing silently, since it directly feeds a headline KPI.

## 2. Screens you own

### Reports & Analytics (screen 7)
```
KPI row: 4 equal-width cards, colored left border:
- FUEL EFFICIENCY — e.g. 8.4 km/l (blue)
- FLEET UTILIZATION — e.g. 81% (green)
- OPERATIONAL COST — e.g. 34,070 (orange)
- VEHICLE ROI — e.g. 14.2% (green)

Small muted helper text directly below: "ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost"

Two-column row below: LEFT (~55%) "MONTHLY REVENUE" bar chart (7 vertical bars, muted blue, Recharts). RIGHT (~45%) "TOP COSTLIEST VEHICLES" horizontal ranked bar chart, e.g. TRUCK-9 (longest, red) / MINI-03 (medium, orange) / VAN-05 (shortest, blue).

Include an "Export CSV" button top-right of the content area, wired to /reports/export.csv.
```

### Settings & RBAC (screen 8)
```
Two-column layout. LEFT (~30%): "GENERAL" form — Depot Name, Currency, Distance Unit fields, blue "Save Changes" button (intentionally blue, not amber, for this one action).

RIGHT (~70%): "ROLE-BASED ACCESS (RBAC)" matrix table — read-only reference, no need to make it interactively editable:

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics |
|---|---|---|---|---|---|
| Fleet Manager | ✓ | ✓ | – | ✓ | ✓ |
| Dispatcher | View | – | ✓ | – | – |
| Safety Officer | – | ✓ | View | – | – |
| Financial Analyst | View | – | – | ✓ | ✓ |
```

Use the shared design system already wired into Sidebar/TopBar: dark theme, amber #D68910 accent.

## 3. Coordination notes

- Confirm with Ahmed the exact shape of the operational-cost data before you build your ROI/cost report on top of it, so you're not reworking it later.
- Your Settings screen's RBAC table should mirror exactly what Anuj implements in the `requireRole` middleware — if he adjusts the permission matrix, that table needs to match.

## 4. Demo script (prep this by hour 6, don't leave it to hour 8)

Write out the live walkthrough the team will present, built around the spec's example workflow:
1. Log in as each role once to show RBAC in action
2. Register vehicle 'Van-05' (500 kg capacity) and driver 'Alex'
3. Create and dispatch a trip with cargoWeight = 450 kg — succeeds
4. Show vehicle/driver flip to On Trip on the dashboard
5. Complete the trip, show both flip back to Available
6. Try dispatching a trip with cargo over capacity — show the validation block
7. Create a maintenance record — show the vehicle disappear from dispatch selection and flip to In Shop on the dashboard
8. Show Reports & Analytics reflecting the updated numbers, then export CSV

## 5. Last-hour polish (hour 7.5–8)

You'll likely have the most idle time waiting on others' data flow to stabilize in the middle hours — use hour 7.5–8 to: run the full demo script yourself end to end, catch any visual inconsistencies across screens (spacing, badge colors, button styles drifting from the shared design system), and confirm the deploy link or recording is ready for submission.
