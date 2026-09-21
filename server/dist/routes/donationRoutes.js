"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const donationController_1 = require("../controllers/donationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Independent donation (guest or logged-in user)
router.post('/', auth_1.optionalAuthentication, donationController_1.donationController.createDonation);
router.get('/user', auth_1.requireAuthentication, donationController_1.donationController.getUserDonations);
router.get('/', donationController_1.donationController.getAllDonations);
exports.default = router;
