import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  sendRequestReceived,
  sendAdminNewRequest,
  sendRequestApproved,
  sendRequestRejected,
} from '../services/mailer';

const router = Router();
const prisma = new PrismaClient();

// Public — submit a registration request
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, orgName } = req.body;
    if (!name || !email || !password || !orgName)
      return void res.status(400).json({ message: 'name, email, password and company name are required' });
    if (password.length < 6)
      return void res.status(400).json({ message: 'Password must be at least 6 characters' });

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
      await prisma.registrationRequest.delete({ where: { email } });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.registrationRequest.create({ data: { name, email, password: hashed, orgName } });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
    await Promise.allSettled([
      sendRequestReceived(email, name),
      ...admins.map(a => sendAdminNewRequest(a.email, name, email)),
    ]);

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
      select: { id: true, name: true, email: true, orgName: true, status: true, createdAt: true, reviewedAt: true, rejectReason: true },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

// Approve or reject
router.patch('/:id', async (req, res, next) => {
  try {
    const { action, rejectReason } = req.body;
    if (!['approve', 'reject'].includes(action))
      return void res.status(400).json({ message: 'action must be approve or reject' });

    const request = await prisma.registrationRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return void res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING')
      return void res.status(409).json({ message: 'Request has already been reviewed' });

    if (action === 'approve') {
      // Create org + Fleet Manager user in one transaction
      await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({ data: { name: request.orgName || request.name } });
        await tx.user.create({
          data: {
            name: request.name,
            email: request.email,
            password: request.password,
            role: 'FLEET_MANAGER',
            orgId: org.id,
            mustChangePassword: false,
          },
        });
        await tx.registrationRequest.update({
          where: { id: request.id },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        });
      });
      await sendRequestApproved(request.email, request.name).catch(() => {});
      res.json({ message: 'Request approved. Fleet Manager account created.' });
    } else {
      await prisma.registrationRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', reviewedAt: new Date(), rejectReason: rejectReason ?? null },
      });
      await sendRequestRejected(request.email, request.name, rejectReason).catch(() => {});
      res.json({ message: 'Request rejected.' });
    }
  } catch (err: any) {
    if (err.code === 'P2002') return void res.status(409).json({ message: 'An account with this email already exists' });
    next(err);
  }
});

export default router;
