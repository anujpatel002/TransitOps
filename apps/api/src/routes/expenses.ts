import { Router } from 'express';
import { verifyToken } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/', (_req, res) => res.json([]));
router.post('/', (_req, res) => res.status(201).json({}));
router.delete('/:id', (_req, res) => res.status(204).send());

export default router;
