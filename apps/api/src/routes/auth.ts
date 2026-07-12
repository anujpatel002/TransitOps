import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const MAX_ATTEMPTS = 5;

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.lockedAt) {
      res.status(403).json({ message: 'Account locked after 5 failed attempts' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedAt: locked ? new Date() : null,
        },
      });
      if (locked) {
        res.status(403).json({ message: 'Account locked after 5 failed attempts' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
      return;
    }

    // Reset on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedAt: null },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', verifyToken, async (req: any, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return void res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, mustChangePassword: false },
    });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
