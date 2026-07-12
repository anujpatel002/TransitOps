# TransitOps — Live Demo Script

**Total time: ~8 minutes. Prep: run `npm run db:seed` before presenting.**

---

## Step 1 — RBAC login tour (~1 min)

Open Settings → RBAC table so it's visible on screen.

| Login as | Email | Password | Show |
|---|---|---|---|
| Fleet Manager | rohan.k@transitops.io | fleet123 | Full nav, all tabs enabled |
| Dispatcher | anuj.d@transitops.io | dispatch123 | Fleet = read-only, no Fuel/Expenses tab |
| Safety Officer | vivek.r@transitops.io | safety123 | Drivers + Trips (view) only |
| Financial Analyst | ahmed.f@transitops.io | finance123 | Fleet read-only, Fuel/Expenses + Analytics |

Log back in as **Fleet Manager** (rohan.k) for the rest of the demo.

---

## Step 2 — Register Van-05 and driver Alex (~1 min)

> Van-05 and Alex Fernandez are already in the seed — point them out rather than re-creating.

- Fleet → find **VAN-05** (Van Echo, 500 kg capacity, AVAILABLE)
- Drivers → find **Alex Fernandez** (DL-1005, safety score 100, AVAILABLE)

If the judges want a live create: add a new vehicle `VAN-06` (maxLoadKg = 500) and a driver named `Alex B`.

---

## Step 3 — Dispatch a trip with cargoWeight = 450 kg (~1 min)

Trips → New Trip:
- Vehicle: VAN-05 (500 kg capacity)
- Driver: Alex Fernandez
- Source: Pune → Destination: Nashik
- Cargo Weight: **450 kg** → Submit

Expected: trip created with status **DISPATCHED**.

---

## Step 4 — Dashboard shows On Trip (~30 sec)

Dashboard → observe:
- VAN-05 status badge → **ON TRIP**
- Alex Fernandez status badge → **ON TRIP**
- "Active Trips" KPI increments

---

## Step 5 — Complete the trip, both flip back to Available (~30 sec)

Trips → find the trip → **Complete**.

Dashboard → observe:
- VAN-05 → **AVAILABLE**
- Alex Fernandez → **AVAILABLE**
- "Active Trips" KPI decrements

---

## Step 6 — Over-capacity validation block (~30 sec)

Trips → New Trip:
- Vehicle: VAN-05 (500 kg capacity)
- Cargo Weight: **600 kg** → Submit

Expected: **validation error** — "Cargo weight exceeds vehicle capacity (500 kg)".

---

## Step 7 — Maintenance record → vehicle disappears from dispatch (~1 min)

Maintenance → New Record:
- Vehicle: VAN-05
- Description: Scheduled service
- Cost: 2500

Expected:
- VAN-05 status → **IN SHOP**
- VAN-05 no longer appears in the vehicle dropdown when creating a new trip
- Dashboard "Vehicles in Maintenance" KPI increments

---

## Step 8 — Reports & Analytics + CSV export (~1 min)

Analytics page:
- Point out the 4 KPI cards (Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI)
- Show Monthly Revenue bar chart — note the current month bar updated after the completed trip
- Show Top Costliest Vehicles horizontal chart
- Click **Export CSV** → file downloads as `transitops-report.csv`
- Open CSV in browser/Excel to show per-vehicle ROI breakdown

---

## Credentials quick-ref

```
Fleet Manager     rohan.k@transitops.io   / fleet123
Dispatcher        anuj.d@transitops.io    / dispatch123
Safety Officer    vivek.r@transitops.io   / safety123
Financial Analyst ahmed.f@transitops.io   / finance123
```

## Revenue assumption (for judge questions)

Revenue is calculated as **₹15 × plannedDist km** per completed trip. This is a seeded placeholder agreed by the team — a `revenuePerKm` config field can be added to Settings post-hackathon.
