import { Router } from 'express';
import { bookingsController } from '../controllers/BookingsController.js';

const router = Router();

router.get('/', (req, res) => bookingsController.getAll(req, res));
router.post('/', (req, res) => bookingsController.create(req, res));
router.patch('/:id/cancel', (req, res) => bookingsController.cancel(req, res));

export default router;
