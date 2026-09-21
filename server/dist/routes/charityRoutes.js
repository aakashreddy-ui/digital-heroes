"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const charityController_1 = require("../controllers/charityController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public
router.get('/', charityController_1.charityController.getDirectory);
// Subscriber selection
router.get('/user/selection', auth_1.requireAuthentication, charityController_1.charityController.getUserCharity);
router.post('/user/selection', auth_1.requireAuthentication, charityController_1.charityController.setUserCharity);
// Details
router.get('/:id', charityController_1.charityController.getCharity);
// Admin CRUD
router.post('/', auth_1.requireAdmin, charityController_1.charityController.createCharity);
router.put('/:id', auth_1.requireAdmin, charityController_1.charityController.updateCharity);
router.delete('/:id', auth_1.requireAdmin, charityController_1.charityController.deleteCharity);
exports.default = router;
