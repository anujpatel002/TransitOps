import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();

// Public — submit a registration request
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return void res.status(400).json({ message: 'name, email and password are required' });
    if (password.length < 6)
      return void res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Check no existing user or pending request
    const [existingUser, existingReq] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.registrationRequest.findUnique({ where: { email } }),
    ]);
    if (existingUser) return void res.status(409).json({ message: 'An account with this email already exists' });
    if (existingReq) {
      if (existingReq.status === 'PENDING')
        return void res.status(409).json({ message: 'A registration request for this email is already pending' });
      if (existingReq.status === 'APPROVED')
        return void res.status(409).json({ message: 'This email has already been approved. Please log in.' });
      // REJECTED — allow re-apply by deleting old request
      await prisma.registrationRequest.delete({ where: { email } });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.registrationRequest.create({ data: { name, email, password: hashed } });
    res.status(201).json({ message: 'Registration request submitted. You will be notified once approved.' });
  } catch (err) { next(err); }
});

// ADMIN only below
router.use(verifyToken, requireRole('ADMIN'));

// List all requests
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const requests = await prisma.registrationRequest.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, status: true, createdAt: true, reviewedAt: true, rejectReason: true },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

// Approve or reject
router.patch('/:id', async (req, res, next) => {
  try {
    const { action, rejectReason } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action))
      return void res.status(400).json({ message: 'action must be approve or reject' });

    const request = await prisma.registrationRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return void res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING')
      return void res.status(409).json({ message: 'Request has already been reviewed' });

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.user.create({
          data: {
            name: request.name,
            email: request.email,
            password: request.password,
            role: 'FLEET_MANAGER',
            mustChangePassword: false,
          },
        }),
        prisma.registrationRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        }),
      ]);
      res.json({ message: 'Request approved. Fleet Manager account created.' });
    } else {
      await prisma.registrationRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', reviewedAt: new Date(), rejectReason: rejectReason ?? null },
      });
      res.json({ message: 'Request rejected.' });
    }
  } catch (err: any) {
    if (err.code === 'P2002') return void res.status(409).json({ message: 'An account with this email already exists' });
    next(err);
  }
});

export default router;
