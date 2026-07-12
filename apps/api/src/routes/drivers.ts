import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

// GET /drivers/available — AVAILABLE, valid license, not SUSPENDED
// Hard rule: expired-license or suspended drivers are blocked from trip assignment
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

// GET /drivers — full list
router.get('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER', 'DISPATCHER'), async (_req, res, next) => {
  try {
    res.json(await prisma.driver.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    const d = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(d);
  } catch (err) { next(err); }
});

// POST /drivers — create
router.post('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.status(201).json(await prisma.driver.create({ data: req.body }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Driver with this information already exists' });
      return;
    }
    next(err);
  }
});

// PATCH /drivers/:id — partial update (status, safetyScore, etc.)
router.patch('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await prisma.driver.update({ where: { id: req.params.id }, data: req.body }));
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
