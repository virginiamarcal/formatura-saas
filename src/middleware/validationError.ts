import { Response } from 'express';
import { ZodError } from 'zod';

export interface ValidationErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  status: number;
}

/**
 * Format Zod validation errors into a user-friendly response
 */
export function formatValidationError(
  error: ZodError
): { details: Record<string, string[]>; message: string } {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string[]> = {};

  // Convert field errors
  if (flattened.fieldErrors) {
    Object.entries(flattened.fieldErrors).forEach(([field, messages]: [string, any]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages : [];
    });
  }

  const firstFieldError = Object.keys(fieldErrors)[0];
  const message = firstFieldError
    ? `Validation failed: ${fieldErrors[firstFieldError][0]}`
    : 'Validation failed';

  return {
    details: fieldErrors,
    message,
  };
}

/**
 * Send a formatted 400 validation error response
 */
export function sendValidationError(
  res: Response,
  error: ZodError | Record<string, string[]>
): void {
  let details: Record<string, string[]>;
  let message: string;

  if (error instanceof ZodError) {
    const formatted = formatValidationError(error);
    details = formatted.details;
    message = formatted.message;
  } else {
    details = error;
    message = 'Validation failed';
  }

  res.status(400).json({
    error: 'Validation Error',
    message,
    details,
  });
}

/**
 * Send a formatted 403 authorization error response
 */
export function sendAuthorizationError(
  res: Response,
  message: string = 'You do not have permission to perform this action'
): void {
  res.status(403).json({
    error: 'Forbidden',
    message,
  });
}

/**
 * Send a formatted 404 not found error response
 */
export function sendNotFoundError(
  res: Response,
  resource: string = 'Resource'
): void {
  res.status(404).json({
    error: 'Not Found',
    message: `${resource} not found`,
  });
}

/**
 * Send a formatted 409 conflict error response
 */
export function sendConflictError(res: Response, message: string): void {
  res.status(409).json({
    error: 'Conflict',
    message,
  });
}

/**
 * Send a formatted 500 server error response
 */
export function sendServerError(
  res: Response,
  error: Error | unknown,
  isDevelopment: boolean = false
): void {
  console.error('Server error:', error);

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? message : 'An unexpected error occurred',
  });
}
