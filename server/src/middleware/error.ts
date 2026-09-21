import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('API Error:', err);

  const mappedClientError =
    err.name === 'ValidationError' ||
    err.name === 'ScoreValidationError' ||
    err.name === 'CharityValidationError' ||
    err.name === 'AuthError' ||
    err.name === 'DrawEngineError' ||
    err.name === 'WinnerServiceError' ||
    err.name === 'SubscriptionError';
  const statusCode = err.statusCode || (mappedClientError ? 400 : 500);
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred. Please try again.';

  const response: ApiResponse = {
    success: false,
    message,
    errorCode,
    data: null,
  };

  res.status(statusCode).json(response);
}

export function sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}
