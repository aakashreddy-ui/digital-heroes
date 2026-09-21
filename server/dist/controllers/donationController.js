"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationController = void 0;
const charityService_1 = require("../services/charityService");
const donationRepository_1 = require("../repositories/donationRepository");
const error_1 = require("../middleware/error");
const validators_1 = require("../validators");
exports.donationController = {
    createDonation(req, res, next) {
        try {
            const userId = req.user?.id;
            const { charity_id, amount_cents, frequency, donor_name, donor_email } = (0, validators_1.validate)(validators_1.donationSchema, req.body);
            const donation = charityService_1.charityService.createIndependentDonation({
                userId,
                donorName: donor_name,
                donorEmail: donor_email,
                charityId: charity_id,
                amountCents: Number(amount_cents),
                frequency,
            });
            return (0, error_1.sendSuccess)(res, donation, 'Independent donation created successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    getUserDonations(req, res, next) {
        try {
            const userId = req.user.id;
            const donations = donationRepository_1.donationRepository.getByUserId(userId);
            return (0, error_1.sendSuccess)(res, donations, 'User donations');
        }
        catch (err) {
            next(err);
        }
    },
    getAllDonations(_req, res, next) {
        try {
            const donations = donationRepository_1.donationRepository.getAll();
            return (0, error_1.sendSuccess)(res, donations, 'All independent donations');
        }
        catch (err) {
            next(err);
        }
    }
};
