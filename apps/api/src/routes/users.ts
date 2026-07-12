import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { sendTempPassword } from '../services/mailer';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken, requireRole('FLEET_MANAGER', 'ADMIN'));

// List users — ADMIN sees all, FLEET_MANAGER sees own org only
router.get('/', async (req: any, res, next) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { orgId: req.user.orgId };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, orgId: true, org: { select: { name: true } }, mustChangePassword: true, lockedAt: true },
      orderBy: { email: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// Create user — inherits creator's orgId
router.post('/', async (req: any, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password)
      return void res.status(400).json({ message: 'name, email, role and password are required' });

    const hashed = await bcrypt.hash(password, 10);
    const assignedOrgId = req.user.role === 'ADMIN'
      ? (req.body.orgId || null)
      : (req as any).user.orgId ?? null;
    const user = await prisma.user.create({
      data: { name, email, role, password: hashed, mustChangePassword: true, orgId: assignedOrgId },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
    });
    await sendTempPassword(email, name, password).catch(() => {});
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === 'P2002') return void res.status(409).json({ message: 'Email already exists' });
    next(err);
  }
});

// Update — ADMIN can update any user, FLEET_MANAGER only own org
router.patch('/:id', async (req: any, res, next) => {
  try {
    const { role, unlock } = req.body;
    const where = req.user.role === 'ADMIN'
      ? { id: req.params.id }
      : { id: req.params.id, orgId: req.user.orgId };
    const target = await prisma.user.findFirst({ where });
    if (!target) return void res.status(404).json({ message: 'User not found' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role && { role }),
        ...(unlock && { lockedAt: null, failedLoginAttempts: 0 }),
      },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true, lockedAt: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// Delete — ADMIN can delete any user, FLEET_MANAGER only own org
router.delete('/:id', async (req: any, res, next) => {
  try {
    const where = req.user.role === 'ADMIN'
      ? { id: req.params.id }
      : { id: req.params.id, orgId: req.user.orgId };
    const target = await prisma.user.findFirst({ where });
    if (!target) return void res.status(404).json({ message: 'User not found' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
