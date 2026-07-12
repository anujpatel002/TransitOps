import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Revenue assumption: ₹15 per km of plannedDist per completed trip (agreed placeholder)
const REVENUE_PER_KM = 15;

export async function getFuelEfficiency() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' } },
    include: {
      trips: {
        where: { status: 'COMPLETED', fuelConsumed: { gt: 0 } },
        select: { plannedDist: true, fuelConsumed: true },
      },
    },
    select: {
      id: true, regNumber: true, name: true,
      trips: true,
    },
  });

  return vehicles.map(v => {
    const totalDist = v.trips.reduce((s, t) => s + t.plannedDist, 0);
    const totalFuel = v.trips.reduce((s, t) => s + (t.fuelConsumed ?? 0), 0);
    const kmPerLitre = totalFuel > 0 ? +(totalDist / totalFuel).toFixed(2) : null;
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, totalDistKm: totalDist, totalFuelL: totalFuel, kmPerLitre };
  });
}

export async function getUtilization() {
  const vehicles = await prisma.vehicle.findMany({
    select: { status: true },
  });
  const active = vehicles.filter(v => v.status !== 'RETIRED').length;
  const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const utilization = active > 0 ? Math.round((onTrip / active) * 100) : 0;
  return { total: vehicles.length, active, onTrip, utilization };
}

export async function getCost() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' } },
    include: {
      fuelLogs:    { select: { cost: true } },
      maintenance: { select: { cost: true } },
    },
    select: {
      id: true, regNumber: true, name: true,
      fuelLogs: true, maintenance: true,
    },
  });

  return vehicles.map(v => {
    const fuelCost  = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, fuelCost, maintCost, totalCost: fuelCost + maintCost };
  });
}

export async function getRoi() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' } },
    include: {
      fuelLogs:    { select: { cost: true } },
      maintenance: { select: { cost: true } },
      trips: {
        where: { status: 'COMPLETED' },
        select: { plannedDist: true },
      },
    },
    select: {
      id: true, regNumber: true, name: true,
      acquisitionCost: true,
      fuelLogs: true, maintenance: true, trips: true,
    },
  });

  return vehicles.map(v => {
    const fuelCost  = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    const revenue   = v.trips.reduce((s, t) => s + t.plannedDist * REVENUE_PER_KM, 0);
    const roi = v.acquisitionCost > 0
      ? +((revenue - (maintCost + fuelCost)) / v.acquisitionCost * 100).toFixed(2)
      : null;
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, revenue, fuelCost, maintCost, acquisitionCost: v.acquisitionCost, roiPct: roi };
  });
}

// Aggregated summary for CSV + KPI cards
export async function getSummary() {
  const [efficiency, utilization, cost, roi] = await Promise.all([
    getFuelEfficiency(), getUtilization(), getCost(), getRoi(),
  ]);

  const avgKmL = (() => {
    const valid = efficiency.filter(e => e.kmPerLitre !== null);
    return valid.length ? +(valid.reduce((s, e) => s + e.kmPerLitre!, 0) / valid.length).toFixed(1) : 0;
  })();

  const totalCost = cost.reduce((s, c) => s + c.totalCost, 0);

  const avgRoi = (() => {
    const valid = roi.filter(r => r.roiPct !== null);
    return valid.length ? +(valid.reduce((s, r) => s + r.roiPct!, 0) / valid.length).toFixed(1) : 0;
  })();

  return { avgKmL, utilization: utilization.utilization, totalCost, avgRoi, efficiency, cost, roi };
}

// Monthly revenue: last 7 months, sum of (plannedDist * REVENUE_PER_KM) for COMPLETED trips
export async function getMonthlyRevenue() {
  const trips = await prisma.trip.findMany({
    where: { status: 'COMPLETED' },
    select: { plannedDist: true, createdAt: true },
  });

  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short' });
    months[key] = 0;
  }

  trips.forEach(t => {
    const key = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
    if (key in months) months[key] += t.plannedDist * REVENUE_PER_KM;
  });

  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
}

export { prisma };
