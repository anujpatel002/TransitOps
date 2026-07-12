import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

// GET /vehicles/available — vehicles that can be dispatched
// Hard rule: only AVAILABLE vehicles, never RETIRED / IN_SHOP
router.get('/available', requireRole('FLEET_MANAGER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
    res.json(vehicles);
  } catch (err) { next(err); }
});

// GET /vehicles — full list with optional ?type= and ?status= filters
router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const where: Prisma.VehicleWhereInput = {};
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.status) where.status = req.query.status as any;
    res.json(await prisma.vehicle.findMany({ where, orderBy: { regNumber: 'asc' } }));
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

// POST /vehicles — create; enforce regNumber uniqueness with clear error
router.post('/', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.vehicle.create({ data: req.body }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Registration number already exists' });
      return;
    }
    next(err);
  }
});

// PATCH /vehicles/:id — partial update (supports status-only updates for maintenance flow)
router.patch('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Registration number already exists' });
      return;
    }
    next(err);
  }
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
