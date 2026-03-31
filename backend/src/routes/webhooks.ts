import { Router } from 'express';
import { webhooksController } from '../controllers/WebhooksController.js';

const router = Router();

// No auth middleware — secured by X-Koru-Triggers-Event header validated by caller
router.post('/ecommerce', (req, res) => webhooksController.handleEcommerce(req, res));

export default router;
