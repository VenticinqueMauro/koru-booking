import { Router } from 'express';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';
import { reservationsController } from '../controllers/ReservationsController.js';

const router = Router();

// Server-to-server match endpoint (secret-authenticated) — must precede /:id
router.get('/match', (req, res) => reservationsController.match(req, res));

router.get('/', dualAuthMiddleware, (req, res) => reservationsController.getAll(req as any, res));
router.post('/', dualAuthMiddleware, (req, res) => reservationsController.create(req as any, res));
router.get('/:id', dualAuthMiddleware, (req, res) => reservationsController.getById(req as any, res));
router.delete('/:id', dualAuthMiddleware, (req, res) => reservationsController.cancel(req as any, res));

export default router;
