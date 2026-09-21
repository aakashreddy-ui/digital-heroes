"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drawController_1 = require("../controllers/drawController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public
router.get('/upcoming', drawController_1.drawController.getUpcoming);
router.get('/latest', drawController_1.drawController.getLatestPublished);
router.get('/', drawController_1.drawController.getAllDraws);
router.get('/user/entries', auth_1.requireAuthentication, drawController_1.drawController.getUserEntries);
router.get('/:id', drawController_1.drawController.getDrawById);
// Admin
router.post('/', auth_1.requireAdmin, drawController_1.drawController.adminCreateDraw);
router.post('/:id/simulate', auth_1.requireAdmin, drawController_1.drawController.adminSimulateDraw);
router.post('/:id/publish', auth_1.requireAdmin, drawController_1.drawController.adminPublishDraw);
exports.default = router;
