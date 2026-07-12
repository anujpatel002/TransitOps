import { Router } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { TripError, createTrip, listTrips, dispatchTrip, completeTrip, cancelTrip } from '../services/tripService';

const router = Router();
router.use(verifyToken);

const orgId = (req: AuthRequest) => req.user!.orgId!;

router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await listTrips(orgId(req)));
  } catch (err) { next(err); }
});

router.post('/', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    res.status(201).json(await createTrip(req.body, orgId(req)));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

router.post('/:id/dispatch', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await dispatchTrip(req.params.id, orgId(req)));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

router.post('/:id/complete', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    const { finalOdometer, fuelConsumed } = req.body;
    res.json(await completeTrip(req.params.id, finalOdometer, fuelConsumed, orgId(req)));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

router.post('/:id/cancel', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req: AuthRequest, res, next) => {
  try {
    res.json(await cancelTrip(req.params.id, orgId(req)));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

export default router;
