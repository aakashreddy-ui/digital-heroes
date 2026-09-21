import { Router } from 'express';
import { winnerController } from '../controllers/winnerController';
import { requireAuthentication, requireAdmin } from '../middleware/auth';
import { uploadProofMiddleware } from '../middleware/upload';

const router = Router();

// Subscriber
router.get('/', requireAuthentication, winnerController.getUserWinnings);
router.get('/user', requireAuthentication, winnerController.getUserWinnings);
router.post(
  '/:id/proof',
  requireAuthentication,
  uploadProofMiddleware.single('proof_image'),
  winnerController.uploadProof
);
router.get('/:id', requireAuthentication, winnerController.getWinnerById);

// Admin
router.get('/admin/all', requireAdmin, winnerController.adminGetAll);
router.post('/admin/:id/verify', requireAdmin, winnerController.adminVerify);
router.post('/admin/:id/payout', requireAdmin, winnerController.adminPayout);

export default router;
