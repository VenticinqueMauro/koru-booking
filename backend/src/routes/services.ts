import { Router } from 'express';
import { servicesController } from '../controllers/ServicesController.js';
import { dualAuthMiddleware } from '../middleware/dualAuth.js';

const router = Router();

// All routes require authentication (JWT or Koru credentials)
router.use(dualAuthMiddleware);

router.get('/', (req, res) => servicesController.getAll(req, res));
router.get('/:id', (req, res) => servicesController.getOne(req, res));
router.post('/', (req, res) => servicesController.create(req, res));
router.put('/:id', (req, res) => servicesController.update(req, res));
router.delete('/:id', (req, res) => servicesController.delete(req, res));

export default router;
