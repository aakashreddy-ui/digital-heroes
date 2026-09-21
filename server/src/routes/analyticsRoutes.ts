import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAdmin);
router.get('/', analyticsController.getOverview);

export default router;
