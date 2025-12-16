import { Router } from 'express';
import { schedulesController } from '../controllers/SchedulesController.js';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';

const router = Router();

router.use(dualAuthMiddleware);

router.get('/', (req, res) => schedulesController.getAll(req, res));
router.post('/', (req, res) => schedulesController.createOrUpdate(req, res));

export default router;
