import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (_req, res, next) => {
  try {
    res.json(await prisma.expense.findMany({
      include: { vehicle: { select: { regNumber: true, name: true } } },
      orderBy: { date: 'desc' },
    }));
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const { vehicleId, type, amount, date } = req.body;
    res.status(201).json(await prisma.expense.create({
      data: { vehicleId, type, amount, date: new Date(date) },
    }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
