"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const buckets = new Map();
function rateLimit(options = {}) {
    const windowMs = options.windowMs ?? 60_000;
    const max = options.max ?? 120;
    return (req, res, next) => {
        const key = `${req.ip || 'unknown'}:${req.path}`;
        const now = Date.now();
        const existing = buckets.get(key);
        if (!existing || existing.resetAt < now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        existing.count += 1;
        if (existing.count > max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please wait a moment and try again.',
                errorCode: 'RATE_LIMITED',
                data: null,
            });
        }
        return next();
    };
}
