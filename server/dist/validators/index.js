"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationSchema = exports.checkoutSchema = exports.charitySelectionSchema = exports.scoreSchema = exports.loginSchema = exports.signupSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    full_name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.scoreSchema = zod_1.z.object({
    score: zod_1.z.coerce.number().int().min(1).max(45),
    score_date: zod_1.z.string().min(8),
    course_name: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.charitySelectionSchema = zod_1.z.object({
    charity_id: zod_1.z.string().min(1),
    contribution_percentage: zod_1.z.coerce.number().int().min(10).max(100),
});
exports.checkoutSchema = zod_1.z.object({
    plan_id: zod_1.z.enum(['monthly', 'yearly']),
    success_url: zod_1.z.string().url().optional(),
    cancel_url: zod_1.z.string().url().optional(),
});
exports.donationSchema = zod_1.z.object({
    charity_id: zod_1.z.string().min(1),
    amount_cents: zod_1.z.coerce.number().int().positive(),
    frequency: zod_1.z.enum(['one_off', 'monthly']).optional(),
    donor_name: zod_1.z.string().optional(),
    donor_email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
});
function validate(schema, payload) {
    const result = schema.safeParse(payload);
    if (!result.success) {
        const err = new Error(result.error.issues[0]?.message || 'Invalid request');
        err.statusCode = 400;
        err.errorCode = 'VALIDATION_ERROR';
        throw err;
    }
    return result.data;
}
