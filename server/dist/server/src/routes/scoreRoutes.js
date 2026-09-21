"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scoreController_1 = require("../controllers/scoreController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protected subscriber routes
router.use(auth_1.requireSubscriber);
router.get('/', scoreController_1.scoreController.getUserScores);
router.post('/', scoreController_1.scoreController.addScore);
router.put('/:id', scoreController_1.scoreController.updateScore);
router.delete('/:id', scoreController_1.scoreController.deleteScore);
exports.default = router;
