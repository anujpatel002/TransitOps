import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId ?? undefined;

router.get('/kpis', async (req: AuthRequest, res, next) => {
  try {
    const { type, status, region } = req.query as Record<string, string>;
    const oid = orgId(req);

    const vehicleWhere: Record<string, unknown> = oid ? { orgId: oid } : {};
    if (type) vehicleWhere.type = type;
    if (status) vehicleWhere.status = status;

    const [vehicles, trips, drivers] = await Promise.all([
      prisma.vehicle.findMany({ where: vehicleWhere, select: { status: true } }),
      prisma.trip.findMany({
        where: {
          ...(oid ? { vehicle: { orgId: oid } } : {}),
          ...(region ? { OR: [{ source: { contains: region, mode: 'insensitive' } }, { destination: { contains: region, mode: 'insensitive' } }] } : {}),
        },
        select: { status: true },
      }),
      prisma.driver.findMany({ where: oid ? { orgId: oid } : {}, select: { status: true } }),
    ]);

    const activeVehicles    = vehicles.filter(v => v.status !== 'RETIRED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const inMaintenance     = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const onTrip            = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const activeTrips       = trips.filter(t => t.status === 'DISPATCHED').length;
    const pendingTrips      = trips.filter(t => t.status === 'DRAFT').length;
    const driversOnDuty     = drivers.filter(d => d.status === 'ON_TRIP').length;
    const utilization       = activeVehicles > 0 ? Math.round((onTrip / activeVehicles) * 100) : 0;

    const isAdmin = req.user!.role === 'ADMIN';
    const [totalOrgs, totalUsers] = isAdmin
      ? await Promise.all([prisma.organization.count(), prisma.user.count()])
      : [undefined, undefined];

    res.json({
      activeVehicles, availableVehicles, inMaintenance, onTrip,
      activeTrips, pendingTrips, driversOnDuty,
      fleetUtilization: utilization,
      retired: vehicles.filter(v => v.status === 'RETIRED').length,
      total: vehicles.length,
      ...(isAdmin ? { totalOrgs, totalUsers } : {}),
    });
  } catch (err) { next(err); }
});

router.get('/recent-trips', async (req: AuthRequest, res, next) => {
  try {
    const oid = orgId(req);
    const isAdmin = req.user!.role === 'ADMIN';
    res.json(await prisma.trip.findMany({
      where: oid ? { vehicle: { orgId: oid } } : {},
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { regNumber: true, name: true, ...(isAdmin ? { org: { select: { name: true } } } : {}) } },
        driver:  { select: { name: true } },
      },
    }));
  } catch (err) { next(err); }
});

export default router;
