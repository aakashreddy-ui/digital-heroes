import { Router } from 'express';
import { charityController } from '../controllers/charityController';
import { requireAuthentication, requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', charityController.getDirectory);

// Subscriber selection
router.get('/user/selection', requireAuthentication, charityController.getUserCharity);
router.post('/user/selection', requireAuthentication, charityController.setUserCharity);

// Details
router.get('/:id', charityController.getCharity);

// Admin CRUD
router.post('/', requireAdmin, charityController.createCharity);
router.put('/:id', requireAdmin, charityController.updateCharity);
router.delete('/:id', requireAdmin, charityController.deleteCharity);

export default router;
