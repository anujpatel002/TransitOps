import { Router } from 'express';
import { verifyToken } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/', (_req, res) => res.json({}));

export default router;
