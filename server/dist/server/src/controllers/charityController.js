"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.charityController = void 0;
const charityService_1 = require("../services/charityService");
const error_1 = require("../middleware/error");
const validators_1 = require("../validators");
exports.charityController = {
    getDirectory(req, res, next) {
        try {
            const { category, search, featured } = req.query;
            const charities = charityService_1.charityService.getDirectory({
                category: category,
                search: search,
                featuredOnly: featured === 'true',
            });
            return (0, error_1.sendSuccess)(res, charities, 'Charities retrieved');
        }
        catch (err) {
            next(err);
        }
    },
    getCharity(req, res, next) {
        try {
            const id = String(req.params.id);
            const charity = charityService_1.charityService.getCharityById(id);
            return (0, error_1.sendSuccess)(res, charity, 'Charity retrieved');
        }
        catch (err) {
            next(err);
        }
    },
    getUserCharity(req, res, next) {
        try {
            const userId = req.user.id;
            const selection = charityService_1.charityService.getUserCharitySelection(userId);
            return (0, error_1.sendSuccess)(res, selection, 'User charity selection');
        }
        catch (err) {
            next(err);
        }
    },
    setUserCharity(req, res, next) {
        try {
            const userId = req.user.id;
            const { charity_id, contribution_percentage } = (0, validators_1.validate)(validators_1.charitySelectionSchema, req.body);
            const selection = charityService_1.charityService.setUserCharitySelection(userId, charity_id, contribution_percentage);
            return (0, error_1.sendSuccess)(res, selection, 'Charity selection updated');
        }
        catch (err) {
            next(err);
        }
    },
    // Admin
    createCharity(req, res, next) {
        try {
            const charity = charityService_1.charityService.adminCreateCharity(req.body);
            return (0, error_1.sendSuccess)(res, charity, 'Charity created successfully', 201);
        }
        catch (err) {
            next(err);
        }
    },
    updateCharity(req, res, next) {
        try {
            const id = String(req.params.id);
            const updated = charityService_1.charityService.adminUpdateCharity(id, req.body);
            return (0, error_1.sendSuccess)(res, updated, 'Charity updated successfully');
        }
        catch (err) {
            next(err);
        }
    },
    deleteCharity(req, res, next) {
        try {
            const id = String(req.params.id);
            charityService_1.charityService.adminDeleteCharity(id);
            return (0, error_1.sendSuccess)(res, { id }, 'Charity deleted successfully');
        }
        catch (err) {
            next(err);
        }
    }
};
