import { Router } from 'express';
import { scoreController } from '../controllers/scoreController';
import { requireSubscriber } from '../middleware/auth';

const router = Router();

// Protected subscriber routes
router.use(requireSubscriber);

router.get('/', scoreController.getUserScores);
router.post('/', scoreController.addScore);
router.put('/:id', scoreController.updateScore);
router.delete('/:id', scoreController.deleteScore);

export default router;
