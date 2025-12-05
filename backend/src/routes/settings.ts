import { Router } from 'express';
import { settingsController } from '../controllers/SettingsController.js';

const router = Router();

router.get('/', (req, res) => settingsController.get(req, res));
router.post('/', (req, res) => settingsController.update(req, res));

export default router;
