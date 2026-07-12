import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

router.get('/kpis', async (req, res, next) => {
  try {
    const { type, status, region } = req.query as Record<string, string>;

    const vehicleWhere: Record<string, unknown> = {};
    if (type) vehicleWhere.type = type;
    if (status) vehicleWhere.status = status;
    // region filter: stored in source/destination on trips; for vehicles we skip (no region field)

    const [vehicles, trips, drivers] = await Promise.all([
      prisma.vehicle.findMany({ where: vehicleWhere, select: { status: true } }),
      prisma.trip.findMany({
        where: region
          ? { OR: [{ source: { contains: region, mode: 'insensitive' } }, { destination: { contains: region, mode: 'insensitive' } }] }
          : {},
        select: { status: true },
      }),
      prisma.driver.findMany({ select: { status: true } }),
    ]);

    const activeVehicles   = vehicles.filter(v => v.status !== 'RETIRED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const inMaintenance    = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const onTrip           = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const activeTrips      = trips.filter(t => t.status === 'DISPATCHED').length;
    const pendingTrips     = trips.filter(t => t.status === 'DRAFT').length;
    const driversOnDuty    = drivers.filter(d => d.status === 'ON_TRIP').length;
    const utilization      = activeVehicles > 0 ? Math.round((onTrip / activeVehicles) * 100) : 0;

    // Vehicle status counts for proportion bars
    const retired = vehicles.filter(v => v.status === 'RETIRED').length;

    res.json({
      activeVehicles,
      availableVehicles,
      inMaintenance,
      onTrip,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization: utilization,
      retired,
      total: vehicles.length,
    });
  } catch (err) { next(err); }
});

// Recent trips for dashboard table
router.get('/recent-trips', async (_req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { regNumber: true, name: true } },
        driver:  { select: { name: true } },
      },
    });
    res.json(trips);
  } catch (err) { next(err); }
});

export default router;
