import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

// GET /drivers/available — AVAILABLE, valid license, not SUSPENDED
router.get('/available', requireRole('FLEET_MANAGER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'AVAILABLE',
        licenseExpiry: { gt: new Date() },
      },
    });
    res.json(drivers);
  } catch (err) { next(err); }
});

router.get('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (_req, res, next) => {
  try {
    res.json(await prisma.driver.findMany());
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    const d = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(d);
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.driver.create({ data: req.body }));
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await prisma.driver.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
