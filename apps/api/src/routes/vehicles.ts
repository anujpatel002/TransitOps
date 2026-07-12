import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

// GET /vehicles/available — vehicles that can be dispatched (Tirth owns full impl)
router.get('/available', requireRole('FLEET_MANAGER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
    res.json(vehicles);
  } catch (err) { next(err); }
});

router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), async (_req, res, next) => {
  try {
    res.json(await prisma.vehicle.findMany());
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const [v, fuel, maint] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id } }),
      prisma.fuelLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true } }),
    ]);
    if (!v) { res.status(404).json({ message: 'Not found' }); return; }
    const fuelCost = fuel._sum.cost ?? 0;
    const maintenanceCost = maint._sum.cost ?? 0;
    res.json({ ...v, fuelCost, maintenanceCost, totalOperationalCost: fuelCost + maintenanceCost });
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.vehicle.create({ data: req.body }));
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
