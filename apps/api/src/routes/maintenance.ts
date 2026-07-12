import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { createMaintenance, closeMaintenance, listMaintenance } from '../services/maintenanceService';

const router = Router();
router.use(verifyToken);

router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DISPATCHER'), async (_req, res, next) => {
  try {
    res.json(await listMaintenance());
  } catch (err) { next(err); }
});

router.post('/', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    const { vehicleId, desc, cost } = req.body;
    res.status(201).json(await createMaintenance(vehicleId, desc, cost));
  } catch (err) { next(err); }
});

router.post('/:id/close', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await closeMaintenance(req.params.id));
  } catch (err) { next(err); }
});

export default router;
