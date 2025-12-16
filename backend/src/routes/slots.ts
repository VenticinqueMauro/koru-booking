import { Router } from 'express';
import { slotsController } from '../controllers/SlotsController.js';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';

const router = Router();

router.use(dualAuthMiddleware);

router.get('/', (req, res) => slotsController.getAvailableSlots(req, res));

export default router;
