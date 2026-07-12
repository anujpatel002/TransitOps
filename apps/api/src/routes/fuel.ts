import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await prisma.fuelLog.findMany({
      where: { vehicle: { orgId: orgId(req) } },
      include: { vehicle: { select: { regNumber: true, name: true } } },
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, orgId: orgId(req) } });
    if (!vehicle) { res.status(404).json({ message: 'Vehicle not found' }); return; }
    res.status(201).json(await prisma.fuelLog.create({ data: { vehicleId, liters, cost, date: new Date(date) } }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const log = await prisma.fuelLog.findFirst({ where: { id: req.params.id, vehicle: { orgId: orgId(req) } } });
    if (!log) { res.status(404).json({ message: 'Not found' }); return; }
    await prisma.fuelLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/operational-cost/:vehicleId', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'), async (req: AuthRequest, res, next) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, orgId: orgId(req) } });
    if (!vehicle) { res.status(404).json({ message: 'Vehicle not found' }); return; }
    const [fuel, maint] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId }, _sum: { cost: true } }),
    ]);
    res.json({
      vehicleId,
      fuelCost: fuel._sum.cost ?? 0,
      maintenanceCost: maint._sum.cost ?? 0,
      totalOperationalCost: (fuel._sum.cost ?? 0) + (maint._sum.cost ?? 0),
    });
  } catch (err) { next(err); }
});

export default router;
