"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawController = void 0;
const drawRepository_1 = require("../repositories/drawRepository");
const drawEngineService_1 = require("../services/drawEngineService");
const error_1 = require("../middleware/error");
exports.drawController = {
    getUpcoming(req, res, next) {
        try {
            const draw = drawRepository_1.drawRepository.getUpcomingDraw();
            return (0, error_1.sendSuccess)(res, draw, 'Upcoming draw');
        }
        catch (err) {
            next(err);
        }
    },
    getLatestPublished(req, res, next) {
        try {
            const draw = drawRepository_1.drawRepository.getLatestPublishedDraw();
            return (0, error_1.sendSuccess)(res, draw, 'Latest published draw');
        }
        catch (err) {
            next(err);
        }
    },
    getAllDraws(req, res, next) {
        try {
            const draws = drawRepository_1.drawRepository.getAll();
            return (0, error_1.sendSuccess)(res, draws, 'All draws');
        }
        catch (err) {
            next(err);
        }
    },
    getDrawById(req, res, next) {
        try {
            const id = String(req.params.id);
            const draw = drawRepository_1.drawRepository.getById(id);
            if (!draw) {
                return res.status(404).json({ success: false, message: 'Draw not found', errorCode: 'NOT_FOUND', data: null });
            }
            return (0, error_1.sendSuccess)(res, draw, 'Draw details');
        }
        catch (err) {
            next(err);
        }
    },
    getUserEntries(req, res, next) {
        try {
            const userId = req.user.id;
            const entries = drawRepository_1.drawRepository.getUserEntries(userId);
            return (0, error_1.sendSuccess)(res, entries, 'User draw entries');
        }
        catch (err) {
            next(err);
        }
    },
    // Admin endpoints
    adminCreateDraw(req, res, next) {
        try {
            const { draw_date, month_year, method, jackpot_rollover_cents } = req.body;
            const draw = drawRepository_1.drawRepository.createDraw({
                drawDate: draw_date,
                monthYear: month_year,
                method,
                jackpotRolloverCents: jackpot_rollover_cents,
            });
            return (0, error_1.sendSuccess)(res, draw, 'Draw created successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    adminSimulateDraw(req, res, next) {
        try {
            const id = String(req.params.id);
            const { method, custom_numbers } = req.body;
            const simulation = drawEngineService_1.drawEngineService.simulateDraw(id, method, custom_numbers);
            return (0, error_1.sendSuccess)(res, simulation, 'Simulation completed');
        }
        catch (err) {
            next(err);
        }
    },
    adminPublishDraw(req, res, next) {
        try {
            const id = String(req.params.id);
            const adminId = req.user.id;
            const published = drawEngineService_1.drawEngineService.publishDraw(id, adminId);
            return (0, error_1.sendSuccess)(res, published, 'Draw published successfully');
        }
        catch (err) {
            next(err);
        }
    }
};
