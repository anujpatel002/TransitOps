import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// RBAC permission matrix
// read = GET only, write = all methods
const PERMISSIONS: Record<string, Record<string, 'write' | 'read' | false>> = {
  FLEET_MANAGER:     { fleet: 'write', drivers: 'write', trips: false,   fuel: 'write', analytics: 'write' },
  DISPATCHER:        { fleet: 'read',  drivers: false,   trips: 'write',  fuel: false,   analytics: false   },
  SAFETY_OFFICER:    { fleet: false,   drivers: 'write', trips: 'read',   fuel: false,   analytics: false   },
  FINANCIAL_ANALYST: { fleet: 'read',  drivers: false,   trips: false,    fuel: 'write', analytics: 'write' },
};

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
}

// Resource-level guard: requireAccess('fleet') — checks matrix + read-only enforcement
export function requireAccess(resource: keyof typeof PERMISSIONS[string], writeRequired = false) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const level = PERMISSIONS[role]?.[resource];
    if (!level) { res.status(403).json({ message: 'Forbidden' }); return; }
    if (writeRequired && level === 'read' && req.method !== 'GET') {
      res.status(403).json({ message: 'Read-only access' }); return;
    }
    next();
  };
}

export { PERMISSIONS };
