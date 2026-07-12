import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const REVENUE_PER_KM = 15;

export async function getFuelEfficiency(orgId: string | undefined) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' }, ...(orgId ? { orgId } : {}) },
    include: {
      trips: { where: { status: 'COMPLETED', fuelConsumed: { gt: 0 } }, select: { plannedDist: true, fuelConsumed: true } },
    },
  });
  return vehicles.map(v => {
    const totalDist = v.trips.reduce((s, t) => s + t.plannedDist, 0);
    const totalFuel = v.trips.reduce((s, t) => s + (t.fuelConsumed ?? 0), 0);
    const kmPerLitre = totalFuel > 0 ? +(totalDist / totalFuel).toFixed(2) : null;
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, totalDistKm: totalDist, totalFuelL: totalFuel, kmPerLitre };
  });
}

export async function getUtilization(orgId: string | undefined) {
  const vehicles = await prisma.vehicle.findMany({ where: orgId ? { orgId } : {}, select: { status: true } });
  const active = vehicles.filter(v => v.status !== 'RETIRED').length;
  const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;
  return { total: vehicles.length, active, onTrip, utilization: active > 0 ? Math.round((onTrip / active) * 100) : 0 };
}

export async function getCost(orgId: string | undefined) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' }, ...(orgId ? { orgId } : {}) },
    include: { fuelLogs: { select: { cost: true } }, maintenance: { select: { cost: true } } },
  });
  return vehicles.map(v => {
    const fuelCost  = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, fuelCost, maintCost, totalCost: fuelCost + maintCost };
  });
}

export async function getRoi(orgId: string | undefined) {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: { not: 'RETIRED' }, ...(orgId ? { orgId } : {}) },
    include: {
      fuelLogs:    { select: { cost: true } },
      maintenance: { select: { cost: true } },
      trips: { where: { status: 'COMPLETED' }, select: { plannedDist: true } },
    },
  });
  return vehicles.map(v => {
    const fuelCost  = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    const revenue   = v.trips.reduce((s, t) => s + t.plannedDist * REVENUE_PER_KM, 0);
    const roi = v.acquisitionCost > 0
      ? +((revenue - (maintCost + fuelCost)) / v.acquisitionCost * 100).toFixed(2) : null;
    return { vehicleId: v.id, regNumber: v.regNumber, name: v.name, revenue, fuelCost, maintCost, acquisitionCost: v.acquisitionCost, roiPct: roi };
  });
}

export async function getSummary(orgId: string | undefined) {
  const [efficiency, utilization, cost, roi] = await Promise.all([
    getFuelEfficiency(orgId), getUtilization(orgId), getCost(orgId), getRoi(orgId),
  ]);
  const valid = efficiency.filter(e => e.kmPerLitre !== null);
  const avgKmL = valid.length ? +(valid.reduce((s, e) => s + e.kmPerLitre!, 0) / valid.length).toFixed(1) : 0;
  const totalCost = cost.reduce((s, c) => s + c.totalCost, 0);
  const validRoi = roi.filter(r => r.roiPct !== null);
  const avgRoi = validRoi.length ? +(validRoi.reduce((s, r) => s + r.roiPct!, 0) / validRoi.length).toFixed(1) : 0;
  return { avgKmL, utilization: utilization.utilization, totalCost, avgRoi, efficiency, cost, roi };
}

export async function getMonthlyRevenue(orgId: string | undefined) {
  const trips = await prisma.trip.findMany({
    where: { status: 'COMPLETED', ...(orgId ? { vehicle: { orgId } } : {}) },
    select: { plannedDist: true, createdAt: true },
  });
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months[d.toLocaleString('default', { month: 'short' })] = 0;
  }
  trips.forEach(t => {
    const key = new Date(t.createdAt).toLocaleString('default', { month: 'short' });
    if (key in months) months[key] += t.plannedDist * REVENUE_PER_KM;
  });
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
}

export { prisma };
