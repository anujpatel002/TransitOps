import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (_req, res, next) => {
  try {
    res.json(await prisma.fuelLog.findMany({
      include: { vehicle: { select: { regNumber: true, name: true } } },
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;
    res.status(201).json(await prisma.fuelLog.create({
      data: { vehicleId, liters, cost, date: new Date(date) },
    }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    await prisma.fuelLog.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /fuel/operational-cost/:vehicleId — fuel + maintenance total
router.get('/operational-cost/:vehicleId', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'), async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
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
