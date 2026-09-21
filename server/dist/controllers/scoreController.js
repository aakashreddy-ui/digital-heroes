"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreController = void 0;
const scoreService_1 = require("../services/scoreService");
const error_1 = require("../middleware/error");
const validators_1 = require("../validators");
exports.scoreController = {
    getUserScores(req, res, next) {
        try {
            const userId = req.user.id;
            const scores = scoreService_1.scoreService.getUserScores(userId);
            return (0, error_1.sendSuccess)(res, scores, 'Scores retrieved');
        }
        catch (err) {
            next(err);
        }
    },
    addScore(req, res, next) {
        try {
            const userId = req.user.id;
            const { score, score_date, course_name, notes } = (0, validators_1.validate)(validators_1.scoreSchema, req.body);
            const result = scoreService_1.scoreService.addScore(userId, {
                score: Number(score),
                scoreDate: score_date,
                courseName: course_name,
                notes,
            });
            return (0, error_1.sendSuccess)(res, result, 'Score added successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    updateScore(req, res, next) {
        try {
            const userId = req.user.id;
            const id = String(req.params.id);
            const { score, score_date, course_name, notes } = req.body;
            const updated = scoreService_1.scoreService.updateScore(userId, id, {
                score: score !== undefined ? Number(score) : undefined,
                scoreDate: score_date,
                courseName: course_name,
                notes,
            });
            return (0, error_1.sendSuccess)(res, updated, 'Score updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    deleteScore(req, res, next) {
        try {
            const userId = req.user.id;
            const id = String(req.params.id);
            scoreService_1.scoreService.deleteScore(userId, id);
            return (0, error_1.sendSuccess)(res, { id }, 'Score deleted successfully');
        }
        catch (err) {
            next(err);
        }
    }
};
