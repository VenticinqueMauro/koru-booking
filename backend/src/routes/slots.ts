import { Router } from 'express';
import { slotsController } from '../controllers/SlotsController.js';

const router = Router();

router.get('/', (req, res) => slotsController.getAvailableSlots(req, res));

export default router;
