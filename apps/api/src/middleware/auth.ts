import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow token via query param for file downloads (e.g. CSV export)
  const raw = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : (req.query.token as string | undefined);

  if (!raw) { res.status(401).json({ message: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(raw, process.env.JWT_SECRET!) as { id: string; role: string };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
