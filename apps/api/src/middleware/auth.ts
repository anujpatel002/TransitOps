import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; orgId?: string };
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const raw = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : (req.query.token as string | undefined);

  if (!raw) { res.status(401).json({ message: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(raw, process.env.JWT_SECRET!) as { id: string; role: string; orgId?: string };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
