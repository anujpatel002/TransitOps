import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { createMaintenance, closeMaintenance, listMaintenance } from '../services/maintenanceService';

const router = Router();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await listMaintenance(orgId(req)));
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const { vehicleId, desc, cost } = req.body;
    res.status(201).json(await createMaintenance(vehicleId, desc, cost, orgId(req)));
  } catch (err: any) {
    if (err.message === 'Vehicle not found') { res.status(404).json({ message: err.message }); return; }
    next(err);
  }
});

router.post('/:id/close', requireRole('FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await closeMaintenance(req.params.id, orgId(req)));
  } catch (err: any) {
    if (err.message === 'Maintenance log not found') { res.status(404).json({ message: err.message }); return; }
    next(err);
  }
});

export default router;
