import { Router } from 'express';
import { drawController } from '../controllers/drawController';
import { requireAuthentication, requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/upcoming', drawController.getUpcoming);
router.get('/latest', drawController.getLatestPublished);
router.get('/', drawController.getAllDraws);
router.get('/user/entries', requireAuthentication, drawController.getUserEntries);
router.get('/:id', drawController.getDrawById);

// Admin
router.post('/', requireAdmin, drawController.adminCreateDraw);
router.post('/:id/simulate', requireAdmin, drawController.adminSimulateDraw);
router.post('/:id/publish', requireAdmin, drawController.adminPublishDraw);

export default router;
