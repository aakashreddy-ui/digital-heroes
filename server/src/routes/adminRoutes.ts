import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { drawController } from '../controllers/drawController';
import { winnerController } from '../controllers/winnerController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAdmin);

router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.get('/users/:id/scores', adminController.getUserScores);
router.put('/scores/:id', adminController.adminUpdateScore);
router.get('/subscriptions', adminController.getSubscriptions);

router.get('/draws', drawController.getAllDraws);
router.post('/draws', drawController.adminCreateDraw);
router.post('/draws/:id/simulate', drawController.adminSimulateDraw);
router.post('/draws/:id/publish', drawController.adminPublishDraw);

router.get('/winners', winnerController.adminGetAll);
router.post('/winners/:id/verify', winnerController.adminVerify);
router.post('/winners/:id/reject', (req, res, next) => {
  req.body = { ...req.body, approved: false, notes: req.body.notes };
  return winnerController.adminVerify(req, res, next);
});
router.post('/winners/:id/payout', winnerController.adminPayout);

export default router;
