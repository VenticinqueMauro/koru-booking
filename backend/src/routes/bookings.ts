import { Router } from 'express';
import { bookingsController } from '../controllers/BookingsController.js';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';

const router = Router();

// All routes require authentication
router.use(dualAuthMiddleware);

router.get('/', (req, res) => bookingsController.getAll(req, res));
router.post('/', (req, res) => bookingsController.create(req, res));
router.patch('/:id/cancel', (req, res) => bookingsController.cancel(req, res));

export default router;
