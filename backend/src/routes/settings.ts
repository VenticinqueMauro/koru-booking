import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController.js';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';

const router = Router();

router.use(dualAuthMiddleware);

router.get('/', (req, res) => settingsController.get(req, res));
router.post('/', (req, res) => settingsController.update(req, res));

export default router;
