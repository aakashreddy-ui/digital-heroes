"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthentication = requireAuthentication;
exports.requireSubscriber = requireSubscriber;
exports.requireAdmin = requireAdmin;
exports.optionalAuthentication = optionalAuthentication;
const authService_1 = require("../services/authService");
const subscriptionService_1 = require("../services/subscriptionService");
function requireAuthentication(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Missing or invalid Authorization header.',
            errorCode: 'UNAUTHORIZED',
            data: null,
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = authService_1.authService.verifyToken(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            message: err.message || 'Invalid or expired session token.',
            errorCode: 'INVALID_TOKEN',
            data: null,
        });
    }
}
function requireSubscriber(req, res, next) {
    requireAuthentication(req, res, () => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
                errorCode: 'UNAUTHORIZED',
                data: null,
            });
        }
        // Admins always have access
        if (req.user.role === 'admin') {
            return next();
        }
        const isActive = subscriptionService_1.subscriptionService.isSubscriptionActive(req.user.id);
        if (!isActive) {
            return res.status(403).json({
                success: false,
                message: 'Active subscription required to perform this action.',
                errorCode: 'SUBSCRIPTION_REQUIRED',
                data: null,
            });
        }
        next();
    });
}
function requireAdmin(req, res, next) {
    requireAuthentication(req, res, () => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. Administrator privileges required.',
                errorCode: 'FORBIDDEN',
                data: null,
            });
        }
        next();
    });
}
function optionalAuthentication(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const payload = authService_1.authService.verifyToken(token);
            req.user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };
        }
        catch {
            // Ignore invalid token for optional auth
        }
    }
    next();
}
