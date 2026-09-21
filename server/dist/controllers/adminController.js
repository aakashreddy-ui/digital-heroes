"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const userRepository_1 = require("../repositories/userRepository");
const subscriptionRepository_1 = require("../repositories/subscriptionRepository");
const scoreRepository_1 = require("../repositories/scoreRepository");
const error_1 = require("../middleware/error");
exports.adminController = {
    getUsers(req, res, next) {
        try {
            const { role, search, limit, offset } = req.query;
            const users = userRepository_1.userRepository.getAll({
                role: role,
                search: search,
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
            });
            const total = userRepository_1.userRepository.count({ role: role, search: search });
            return (0, error_1.sendSuccess)(res, { users, total }, 'Users retrieved');
        }
        catch (err) {
            next(err);
        }
    },
    updateUser(req, res, next) {
        try {
            const id = String(req.params.id);
            const { full_name, phone, role } = req.body;
            const updated = userRepository_1.userRepository.update(id, { full_name, phone, role });
            return (0, error_1.sendSuccess)(res, updated, 'User updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    getUserScores(req, res, next) {
        try {
            const id = String(req.params.id);
            const scores = scoreRepository_1.scoreRepository.getByUserId(id);
            return (0, error_1.sendSuccess)(res, scores, 'User scores');
        }
        catch (err) {
            next(err);
        }
    },
    adminUpdateScore(req, res, next) {
        try {
            const id = String(req.params.id);
            const { score, score_date, course_name, notes } = req.body;
            const updated = scoreRepository_1.scoreRepository.adminUpdateScore(id, {
                score: score !== undefined ? Number(score) : undefined,
                scoreDate: score_date,
                courseName: course_name,
                notes,
            });
            return (0, error_1.sendSuccess)(res, updated, 'Score updated by admin');
        }
        catch (err) {
            next(err);
        }
    },
    getSubscriptions(req, res, next) {
        try {
            const { status, limit, offset } = req.query;
            const subscriptions = subscriptionRepository_1.subscriptionRepository.getAll({
                status: status,
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
            });
            return (0, error_1.sendSuccess)(res, subscriptions, 'Subscriptions list');
        }
        catch (err) {
            next(err);
        }
    }
};
