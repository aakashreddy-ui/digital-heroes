"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const winnerController_1 = require("../controllers/winnerController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Subscriber
router.get('/', auth_1.requireAuthentication, winnerController_1.winnerController.getUserWinnings);
router.get('/user', auth_1.requireAuthentication, winnerController_1.winnerController.getUserWinnings);
router.post('/:id/proof', auth_1.requireAuthentication, upload_1.uploadProofMiddleware.single('proof_image'), winnerController_1.winnerController.uploadProof);
router.get('/:id', auth_1.requireAuthentication, winnerController_1.winnerController.getWinnerById);
// Admin
router.get('/admin/all', auth_1.requireAdmin, winnerController_1.winnerController.adminGetAll);
router.post('/admin/:id/verify', auth_1.requireAdmin, winnerController_1.winnerController.adminVerify);
router.post('/admin/:id/payout', auth_1.requireAdmin, winnerController_1.winnerController.adminPayout);
exports.default = router;
