"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winnerController = void 0;
const winnerService_1 = require("../services/winnerService");
const error_1 = require("../middleware/error");
exports.winnerController = {
    getUserWinnings(req, res, next) {
        try {
            const userId = req.user.id;
            const winnings = winnerService_1.winnerService.getUserWinnings(userId);
            return (0, error_1.sendSuccess)(res, winnings, 'User winnings');
        }
        catch (err) {
            next(err);
        }
    },
    getWinnerById(req, res, next) {
        try {
            const id = String(req.params.id);
            const winner = winnerService_1.winnerService.getWinnerById(id);
            return (0, error_1.sendSuccess)(res, winner, 'Winner details');
        }
        catch (err) {
            next(err);
        }
    },
    async uploadProof(req, res, next) {
        try {
            const userId = req.user.id;
            const id = String(req.params.id);
            let fileUrl = req.body.proof_url;
            let originalFilename = req.body.file_name || 'scorecard_proof.png';
            let fileType = req.body.file_type || 'image/png';
            let fileSize = req.body.file_size || 0;
            if (req.file) {
                fileUrl = `/uploads/proofs/${req.file.filename}`;
                originalFilename = req.file.originalname;
                fileType = req.file.mimetype;
                fileSize = req.file.size;
            }
            if (!req.file && fileUrl && !fileUrl.startsWith('/uploads/proofs/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Proof must be uploaded as an image file.',
                    errorCode: 'INVALID_PROOF_SOURCE',
                    data: null,
                });
            }
            if (!fileUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Proof file or proof_url is required.',
                    errorCode: 'MISSING_FILE',
                    data: null,
                });
            }
            const updated = winnerService_1.winnerService.submitProof(userId, id, fileUrl, originalFilename, fileType, fileSize);
            return (0, error_1.sendSuccess)(res, updated, 'Proof uploaded successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // Admin endpoints
    adminGetAll(req, res, next) {
        try {
            const { verification_status, payout_status, draw_id } = req.query;
            const winners = winnerService_1.winnerService.adminGetAll({
                verificationStatus: verification_status,
                payoutStatus: payout_status,
                drawId: draw_id,
            });
            return (0, error_1.sendSuccess)(res, winners, 'All winners');
        }
        catch (err) {
            next(err);
        }
    },
    adminVerify(req, res, next) {
        try {
            const id = String(req.params.id);
            const adminId = req.user.id;
            const { approved, notes } = req.body;
            const result = winnerService_1.winnerService.adminVerifyWinner(adminId, id, Boolean(approved), notes);
            return (0, error_1.sendSuccess)(res, result, `Winner verification ${approved ? 'approved' : 'rejected'}`);
        }
        catch (err) {
            next(err);
        }
    },
    adminPayout(req, res, next) {
        try {
            const id = String(req.params.id);
            const adminId = req.user.id;
            const { payout_reference } = req.body;
            const result = winnerService_1.winnerService.adminMarkPayout(adminId, id, payout_reference);
            return (0, error_1.sendSuccess)(res, result, 'Payout marked as completed');
        }
        catch (err) {
            next(err);
        }
    }
};
