import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/available', requireRole('FLEET_MANAGER', 'DISPATCHER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await prisma.vehicle.findMany({ where: { status: 'AVAILABLE', orgId: orgId(req) } }));
  } catch (err) { next(err); }
});

router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const where: Prisma.VehicleWhereInput = { orgId: orgId(req) };
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.status) where.status = req.query.status as any;
    res.json(await prisma.vehicle.findMany({ where, orderBy: { regNumber: 'asc' } }));
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const [v, fuel, maint] = await Promise.all([
      prisma.vehicle.findFirst({ where: { id, orgId: orgId(req) } }),
      prisma.fuelLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId: id }, _sum: { cost: true } }),
    ]);
    if (!v) { res.status(404).json({ message: 'Not found' }); return; }
    const fuelCost = fuel._sum.cost ?? 0;
    const maintenanceCost = maint._sum.cost ?? 0;
    res.json({ ...v, fuelCost, maintenanceCost, totalOperationalCost: fuelCost + maintenanceCost });
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    res.status(201).json(await prisma.vehicle.create({ data: { ...req.body, orgId: orgId(req) } }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Registration number already exists' }); return;
    }
    next(err);
  }
});

router.patch('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    const v = await prisma.vehicle.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!v) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Registration number already exists' }); return;
    }
    next(err);
  }
});

router.put('/:id', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const v = await prisma.vehicle.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!v) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const v = await prisma.vehicle.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!v) { res.status(404).json({ message: 'Not found' }); return; }
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
