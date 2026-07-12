import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole('ADMIN'));

router.get('/', async (_req, res, next) => {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, vehicles: true } },
      },
    });
    res.json(orgs);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } });
    if (!org) return void res.status(404).json({ message: 'Organization not found' });
    await prisma.organization.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
