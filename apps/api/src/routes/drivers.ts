import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/available', requireRole('FLEET_MANAGER', 'DISPATCHER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await prisma.driver.findMany({
      where: { status: 'AVAILABLE', licenseExpiry: { gt: new Date() }, orgId: orgId(req) },
    }));
  } catch (err) { next(err); }
});

router.get('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER', 'DISPATCHER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await prisma.driver.findMany({ where: { orgId: orgId(req) }, orderBy: { name: 'asc' } }));
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    const d = await prisma.driver.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(d);
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    res.status(201).json(await prisma.driver.create({ data: { ...req.body, orgId: orgId(req) } }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ message: 'Driver with this information already exists' }); return;
    }
    next(err);
  }
});

router.patch('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    const d = await prisma.driver.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(await prisma.driver.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    const d = await prisma.driver.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(await prisma.driver.update({ where: { id: req.params.id }, data: req.body }));
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const d = await prisma.driver.findFirst({ where: { id: req.params.id, orgId: orgId(req) } });
    if (!d) { res.status(404).json({ message: 'Not found' }); return; }
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
