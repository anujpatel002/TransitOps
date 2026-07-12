import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { TripError, createTrip, listTrips, dispatchTrip, completeTrip, cancelTrip } from '../services/tripService';

const router = Router();
router.use(verifyToken);

// GET /trips — Dispatcher (write), Fleet Manager, Safety Officer (read)
router.get('/', requireRole('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'), async (_req, res, next) => {
  try {
    res.json(await listTrips());
  } catch (err) { next(err); }
});

// POST /trips — Dispatcher + Fleet Manager
router.post('/', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const trip = await createTrip(req.body);
    res.status(201).json(trip);
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

// POST /trips/:id/dispatch
router.post('/:id/dispatch', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await dispatchTrip(req.params.id));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

// POST /trips/:id/complete
router.post('/:id/complete', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const { finalOdometer, fuelConsumed } = req.body;
    res.json(await completeTrip(req.params.id, finalOdometer, fuelConsumed));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

// POST /trips/:id/cancel
router.post('/:id/cancel', requireRole('DISPATCHER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await cancelTrip(req.params.id));
  } catch (err) {
    if (err instanceof TripError) { res.status(err.statusCode).json({ message: err.message }); return; }
    next(err);
  }
});

export default router;
