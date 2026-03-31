import { Router } from 'express';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';
import { reservationsController } from '../controllers/ReservationsController.js';

const router = Router();

router.post('/', dualAuthMiddleware, (req, res) => reservationsController.create(req as any, res));
router.get('/:id', dualAuthMiddleware, (req, res) => reservationsController.getById(req as any, res));
router.delete('/:id', dualAuthMiddleware, (req, res) => reservationsController.cancel(req as any, res));

export default router;
