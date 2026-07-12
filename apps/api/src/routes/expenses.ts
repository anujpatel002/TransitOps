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
    res.json(await prisma.expense.findMany({
      where: { vehicle: { orgId: orgId(req) } },
      include: { vehicle: { select: { regNumber: true, name: true } } },
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const { vehicleId, type, amount, date } = req.body;
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, orgId: orgId(req) } });
    if (!vehicle) { res.status(404).json({ message: 'Vehicle not found' }); return; }
    res.status(201).json(await prisma.expense.create({ data: { vehicleId, type, amount, date: new Date(date) } }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req: AuthRequest, res, next) => {
  try {
    const exp = await prisma.expense.findFirst({ where: { id: req.params.id, vehicle: { orgId: orgId(req) } } });
    if (!exp) { res.status(404).json({ message: 'Not found' }); return; }
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
