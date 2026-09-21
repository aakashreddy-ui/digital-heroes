"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.sendSuccess = sendSuccess;
function errorHandler(err, _req, res, _next) {
    console.error('API Error:', err);
    const mappedClientError = err.name === 'ValidationError' ||
        err.name === 'ScoreValidationError' ||
        err.name === 'CharityValidationError' ||
        err.name === 'AuthError' ||
        err.name === 'DrawEngineError' ||
        err.name === 'WinnerServiceError' ||
        err.name === 'SubscriptionError';
    const statusCode = err.statusCode || (mappedClientError ? 400 : 500);
    const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred. Please try again.';
    const response = {
        success: false,
        message,
        errorCode,
        data: null,
    };
    res.status(statusCode).json(response);
}
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    const response = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
}
