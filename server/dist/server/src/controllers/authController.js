"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authService_1 = require("../services/authService");
const error_1 = require("../middleware/error");
const userRepository_1 = require("../repositories/userRepository");
const validators_1 = require("../validators");
exports.authController = {
    async signup(req, res, next) {
        try {
            const { email, password, full_name, phone } = (0, validators_1.validate)(validators_1.signupSchema, req.body);
            const role = req.body.role;
            const result = await authService_1.authService.signup({
                email,
                password,
                fullName: full_name,
                role,
                phone,
            });
            return (0, error_1.sendSuccess)(res, result, 'Registration successful', 201);
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = (0, validators_1.validate)(validators_1.loginSchema, req.body);
            const result = await authService_1.authService.login(email, password);
            return (0, error_1.sendSuccess)(res, result, 'Login successful');
        }
        catch (err) {
            next(err);
        }
    },
    async logout(_req, res) {
        return (0, error_1.sendSuccess)(res, null, 'Logged out successfully');
    },
    async getMe(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 'UNAUTHORIZED', data: null });
            }
            const profile = await authService_1.authService.getProfileWithDetails(req.user.id);
            if (!profile) {
                return res.status(404).json({ success: false, message: 'User not found', errorCode: 'NOT_FOUND', data: null });
            }
            return (0, error_1.sendSuccess)(res, profile, 'Profile retrieved');
        }
        catch (err) {
            next(err);
        }
    },
    async updateProfile(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 'UNAUTHORIZED', data: null });
            }
            const { full_name, phone, avatar_url } = req.body;
            const updated = userRepository_1.userRepository.update(req.user.id, { full_name, phone, avatar_url });
            const enriched = await authService_1.authService.getProfileWithDetails(req.user.id);
            return (0, error_1.sendSuccess)(res, enriched, 'Profile updated successfully');
        }
        catch (err) {
            next(err);
        }
    }
};
