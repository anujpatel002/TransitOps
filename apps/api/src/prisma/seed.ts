import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Admin (no org) ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@transitops.io' },
    update: { name: 'Super Admin' },
    create: { email: 'admin@transitops.io', name: 'Super Admin', password: await hash('admin123'), role: 'ADMIN' },
  });

  // ── Org 1: Mumbai Freight Co ────────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: 'seed-org-001' },
    update: { name: 'Mumbai Freight Co' },
    create: { id: 'seed-org-001', name: 'Mumbai Freight Co' },
  });

  await Promise.all([
    prisma.user.upsert({ where: { email: 'rohan.k@transitops.io' }, update: { name: 'Rohan K', orgId: org1.id }, create: { email: 'rohan.k@transitops.io', name: 'Rohan K', password: await hash('fleet123'),    role: 'FLEET_MANAGER',     orgId: org1.id } }),
    prisma.user.upsert({ where: { email: 'priya.m@transitops.io' }, update: { name: 'Priya M', orgId: org1.id }, create: { email: 'priya.m@transitops.io', name: 'Priya M', password: await hash('fleet123'),    role: 'FLEET_MANAGER',     orgId: org1.id } }),
    prisma.user.upsert({ where: { email: 'anuj.d@transitops.io'  }, update: { name: 'Anuj D',  orgId: org1.id }, create: { email: 'anuj.d@transitops.io',  name: 'Anuj D',  password: await hash('dispatch123'), role: 'DISPATCHER',        orgId: org1.id } }),
    prisma.user.upsert({ where: { email: 'vivek.r@transitops.io' }, update: { name: 'Vivek R', orgId: org1.id }, create: { email: 'vivek.r@transitops.io', name: 'Vivek R', password: await hash('safety123'),   role: 'SAFETY_OFFICER',    orgId: org1.id } }),
    prisma.user.upsert({ where: { email: 'ahmed.f@transitops.io' }, update: { name: 'Ahmed F', orgId: org1.id }, create: { email: 'ahmed.f@transitops.io', name: 'Ahmed F', password: await hash('finance123'),  role: 'FINANCIAL_ANALYST', orgId: org1.id } }),
    prisma.user.upsert({ where: { email: 'tirth@transitops.io'   }, update: { name: 'Tirth',   orgId: org1.id }, create: { email: 'tirth@transitops.io',   name: 'Tirth',   password: await hash('fleet123'),    role: 'FLEET_MANAGER',     orgId: org1.id } }),
  ]);

  // ── Org 2: Delhi Express Logistics ─────────────────────────────────────────
  const org2 = await prisma.organization.upsert({
    where: { id: 'seed-org-002' },
    update: { name: 'Delhi Express Logistics' },
    create: { id: 'seed-org-002', name: 'Delhi Express Logistics' },
  });

  await Promise.all([
    prisma.user.upsert({ where: { email: 'sara.t@transitops.io' }, update: { name: 'Sara T', orgId: org2.id }, create: { email: 'sara.t@transitops.io', name: 'Sara T', password: await hash('fleet123'),   role: 'FLEET_MANAGER',     orgId: org2.id } }),
    prisma.user.upsert({ where: { email: 'neha.s@transitops.io' }, update: { name: 'Neha S', orgId: org2.id }, create: { email: 'neha.s@transitops.io', name: 'Neha S', password: await hash('safety123'),  role: 'SAFETY_OFFICER',    orgId: org2.id } }),
    prisma.user.upsert({ where: { email: 'lina.p@transitops.io' }, update: { name: 'Lina P', orgId: org2.id }, create: { email: 'lina.p@transitops.io', name: 'Lina P', password: await hash('finance123'), role: 'FINANCIAL_ANALYST', orgId: org2.id } }),
  ]);

  console.log('✓ 2 orgs, 10 users');

  // ── Org 1 Vehicles ──────────────────────────────────────────────────────────
  const [vAvail, vOnTrip, vInShop, , vVan05] = await Promise.all([
    prisma.vehicle.upsert({ where: { id: 'seed-veh-001' }, update: {}, create: { id: 'seed-veh-001', regNumber: 'TRK-01', name: 'Truck Alpha',  type: 'Truck', maxLoadKg: 5000, odometer: 12400, acquisitionCost: 85000, status: 'AVAILABLE', orgId: org1.id } }),
    prisma.vehicle.upsert({ where: { id: 'seed-veh-002' }, update: {}, create: { id: 'seed-veh-002', regNumber: 'TRK-02', name: 'Truck Bravo',  type: 'Truck', maxLoadKg: 4500, odometer: 23100, acquisitionCost: 82000, status: 'ON_TRIP',   orgId: org1.id } }),
    prisma.vehicle.upsert({ where: { id: 'seed-veh-003' }, update: {}, create: { id: 'seed-veh-003', regNumber: 'VAN-03', name: 'Van Charlie',  type: 'Van',   maxLoadKg: 1200, odometer: 8900,  acquisitionCost: 35000, status: 'IN_SHOP',   orgId: org1.id } }),
    prisma.vehicle.upsert({ where: { id: 'seed-veh-004' }, update: {}, create: { id: 'seed-veh-004', regNumber: 'TRK-04', name: 'Truck Delta',  type: 'Truck', maxLoadKg: 6000, odometer: 98000, acquisitionCost: 90000, status: 'RETIRED',   orgId: org1.id } }),
    prisma.vehicle.upsert({ where: { id: 'seed-veh-005' }, update: {}, create: { id: 'seed-veh-005', regNumber: 'VAN-05', name: 'Van Echo',     type: 'Van',   maxLoadKg: 500,  odometer: 3200,  acquisitionCost: 28000, status: 'AVAILABLE', orgId: org1.id } }),
  ]);

  // ── Org 2 Vehicles ──────────────────────────────────────────────────────────
  const [vOrg2a] = await Promise.all([
    prisma.vehicle.upsert({ where: { id: 'seed-veh-006' }, update: {}, create: { id: 'seed-veh-006', regNumber: 'TRK-01', name: 'Truck Foxtrot', type: 'Truck', maxLoadKg: 4000, odometer: 5000, acquisitionCost: 75000, status: 'AVAILABLE', orgId: org2.id } }),
    prisma.vehicle.upsert({ where: { id: 'seed-veh-007' }, update: {}, create: { id: 'seed-veh-007', regNumber: 'VAN-02', name: 'Van Golf',      type: 'Van',   maxLoadKg: 800,  odometer: 2000, acquisitionCost: 30000, status: 'AVAILABLE', orgId: org2.id } }),
  ]);

  console.log('✓ 7 vehicles');

  // ── Org 1 Drivers ───────────────────────────────────────────────────────────
  const future  = new Date('2027-12-31');
  const expired = new Date('2023-06-01');

  const [dAvail, dOnTrip] = await Promise.all([
    prisma.driver.upsert({ where: { id: 'seed-drv-001' }, update: {}, create: { id: 'seed-drv-001', name: 'Ravi Kumar',     licenseNumber: 'DL-1001', licenseCategory: 'HGV', licenseExpiry: future,  contact: '+91-9000000001', safetyScore: 98,  status: 'AVAILABLE', orgId: org1.id } }),
    prisma.driver.upsert({ where: { id: 'seed-drv-002' }, update: {}, create: { id: 'seed-drv-002', name: 'Meena Joshi',    licenseNumber: 'DL-1002', licenseCategory: 'HGV', licenseExpiry: future,  contact: '+91-9000000002', safetyScore: 91,  status: 'ON_TRIP',   orgId: org1.id } }),
    prisma.driver.upsert({ where: { id: 'seed-drv-003' }, update: {}, create: { id: 'seed-drv-003', name: 'Suresh Patel',   licenseNumber: 'DL-1003', licenseCategory: 'LMV', licenseExpiry: expired, contact: '+91-9000000003', safetyScore: 75,  status: 'AVAILABLE', orgId: org1.id } }),
    prisma.driver.upsert({ where: { id: 'seed-drv-004' }, update: {}, create: { id: 'seed-drv-004', name: 'Kavya Nair',     licenseNumber: 'DL-1004', licenseCategory: 'HGV', licenseExpiry: future,  contact: '+91-9000000004', safetyScore: 40,  status: 'SUSPENDED', orgId: org1.id } }),
    prisma.driver.upsert({ where: { id: 'seed-drv-005' }, update: {}, create: { id: 'seed-drv-005', name: 'Alex Fernandez', licenseNumber: 'DL-1005', licenseCategory: 'LMV', licenseExpiry: future,  contact: '+91-9000000005', safetyScore: 100, status: 'AVAILABLE', orgId: org1.id } }),
  ]);

  // ── Org 2 Drivers ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.driver.upsert({ where: { id: 'seed-drv-006' }, update: {}, create: { id: 'seed-drv-006', name: 'Priya Singh', licenseNumber: 'DL-2001', licenseCategory: 'HGV', licenseExpiry: future, contact: '+91-9000000006', safetyScore: 95, status: 'AVAILABLE', orgId: org2.id } }),
    prisma.driver.upsert({ where: { id: 'seed-drv-007' }, update: {}, create: { id: 'seed-drv-007', name: 'Raj Sharma',  licenseNumber: 'DL-2002', licenseCategory: 'LMV', licenseExpiry: future, contact: '+91-9000000007', safetyScore: 88, status: 'AVAILABLE', orgId: org2.id } }),
  ]);

  console.log('✓ 7 drivers');

  // ── Org 1 Trips ─────────────────────────────────────────────────────────────
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000);

  await Promise.all([
    prisma.trip.upsert({ where: { id: 'seed-trip-001' }, update: {}, create: { id: 'seed-trip-001', source: 'Mumbai', destination: 'Pune',   vehicleId: vAvail.id,  driverId: dAvail.id,  cargoWeight: 3200, plannedDist: 150, finalOdometer: 12550, fuelConsumed: 42, status: 'COMPLETED',  createdAt: d(10) } }),
    prisma.trip.upsert({ where: { id: 'seed-trip-002' }, update: {}, create: { id: 'seed-trip-002', source: 'Pune',   destination: 'Nashik', vehicleId: vVan05.id,  driverId: dAvail.id,  cargoWeight: 420,  plannedDist: 210, finalOdometer: 3410,  fuelConsumed: 28, status: 'COMPLETED',  createdAt: d(7)  } }),
    prisma.trip.upsert({ where: { id: 'seed-trip-003' }, update: {}, create: { id: 'seed-trip-003', source: 'Mumbai', destination: 'Surat',  vehicleId: vAvail.id,  driverId: dAvail.id,  cargoWeight: 4800, plannedDist: 280, finalOdometer: 12830, fuelConsumed: 78, status: 'COMPLETED',  createdAt: d(3)  } }),
    prisma.trip.upsert({ where: { id: 'seed-trip-004' }, update: {}, create: { id: 'seed-trip-004', source: 'Delhi',  destination: 'Agra',   vehicleId: vOnTrip.id, driverId: dOnTrip.id, cargoWeight: 3000, plannedDist: 200,                                           status: 'DISPATCHED', createdAt: d(1)  } }),
  ]);

  // ── Org 2 Trip ──────────────────────────────────────────────────────────────
  await prisma.trip.upsert({ where: { id: 'seed-trip-005' }, update: {}, create: { id: 'seed-trip-005', source: 'Delhi', destination: 'Jaipur', vehicleId: vOrg2a.id, driverId: 'seed-drv-006', cargoWeight: 1500, plannedDist: 280, finalOdometer: 5280, fuelConsumed: 55, status: 'COMPLETED', createdAt: d(5) } });

  console.log('✓ 5 trips');

  // ── Fuel logs ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.upsert({ where: { id: 'seed-fuel-001' }, update: {}, create: { id: 'seed-fuel-001', vehicleId: vAvail.id,  liters: 42, cost: 3780, date: d(10) } }),
    prisma.fuelLog.upsert({ where: { id: 'seed-fuel-002' }, update: {}, create: { id: 'seed-fuel-002', vehicleId: vVan05.id,  liters: 28, cost: 2520, date: d(7)  } }),
    prisma.fuelLog.upsert({ where: { id: 'seed-fuel-003' }, update: {}, create: { id: 'seed-fuel-003', vehicleId: vAvail.id,  liters: 78, cost: 7020, date: d(3)  } }),
    prisma.fuelLog.upsert({ where: { id: 'seed-fuel-004' }, update: {}, create: { id: 'seed-fuel-004', vehicleId: vOnTrip.id, liters: 55, cost: 4950, date: d(1)  } }),
    prisma.fuelLog.upsert({ where: { id: 'seed-fuel-005' }, update: {}, create: { id: 'seed-fuel-005', vehicleId: vOrg2a.id,  liters: 55, cost: 4950, date: d(5)  } }),
  ]);

  // ── Maintenance logs ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.maintenanceLog.upsert({ where: { id: 'seed-maint-001' }, update: {}, create: { id: 'seed-maint-001', vehicleId: vInShop.id, desc: 'Engine overhaul',      cost: 12000, active: true,  createdAt: d(5)  } }),
    prisma.maintenanceLog.upsert({ where: { id: 'seed-maint-002' }, update: {}, create: { id: 'seed-maint-002', vehicleId: vAvail.id,  desc: 'Tyre replacement',     cost: 4500,  active: false, createdAt: d(20), closedAt: d(18) } }),
    prisma.maintenanceLog.upsert({ where: { id: 'seed-maint-003' }, update: {}, create: { id: 'seed-maint-003', vehicleId: vOnTrip.id, desc: 'Brake pad replacement', cost: 2200,  active: false, createdAt: d(15), closedAt: d(14) } }),
  ]);

  // ── Expenses ─────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.expense.upsert({ where: { id: 'seed-exp-001' }, update: {}, create: { id: 'seed-exp-001', vehicleId: vAvail.id,  type: 'Toll',      amount: 850,   date: d(10) } }),
    prisma.expense.upsert({ where: { id: 'seed-exp-002' }, update: {}, create: { id: 'seed-exp-002', vehicleId: vVan05.id,  type: 'Toll',      amount: 320,   date: d(7)  } }),
    prisma.expense.upsert({ where: { id: 'seed-exp-003' }, update: {}, create: { id: 'seed-exp-003', vehicleId: vAvail.id,  type: 'Parking',   amount: 200,   date: d(3)  } }),
    prisma.expense.upsert({ where: { id: 'seed-exp-004' }, update: {}, create: { id: 'seed-exp-004', vehicleId: vInShop.id, type: 'Insurance', amount: 15000, date: d(30) } }),
  ]);

  console.log('✓ 5 fuel, 3 maintenance, 4 expenses');
  console.log('\n✅ Seed complete');
  console.log('\nOrg 1 — Mumbai Freight Co:');
  console.log('  Fleet Manager → rohan.k@transitops.io / fleet123');
  console.log('  Dispatcher    → anuj.d@transitops.io  / dispatch123');
  console.log('  Safety        → vivek.r@transitops.io / safety123');
  console.log('  Finance       → ahmed.f@transitops.io / finance123');
  console.log('\nOrg 2 — Delhi Express Logistics:');
  console.log('  Fleet Manager → sara.t@transitops.io  / fleet123');
  console.log('\nAdmin (no org):');
  console.log('  Admin         → admin@transitops.io   / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
