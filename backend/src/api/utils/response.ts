/**
 * API Response Utilities
 * Standardized response formats for all API endpoints
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Error response with status code
 */
export interface ErrorResponseData {
  response: ApiResponse;
  statusCode: number;
}

/**
 * Creates a successful API response
 *
 * @param data - Response data payload
 * @returns Standardized success response
 *
 * @example
 * ```typescript
 * res.json(successResponse({ tasks: [...] }));
 * // Returns: { success: true, data: { tasks: [...] } }
 * ```
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a successful API response with a message
 *
 * @param message - Success message
 * @param data - Optional response data payload
 * @returns Standardized success response with message
 *
 * @example
 * ```typescript
 * res.json(successMessageResponse('Task deleted successfully'));
 * // Returns: { success: true, message: 'Task deleted successfully' }
 * ```
 */
export function successMessageResponse<T>(message: string, data?: T): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data && { data }),
  };
}

/**
 * Creates an error API response with appropriate status code
 *
 * @param error - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @returns Error response object with status code
 *
 * @example
 * ```typescript
 * const { response, statusCode } = errorResponse('Task not found', 404);
 * res.status(statusCode).json(response);
 * // Returns 404: { success: false, error: 'Task not found' }
 * ```
 */
export function errorResponse(error: string, statusCode: number = 500): ErrorResponseData {
  return {
    response: {
      success: false,
      error,
    },
    statusCode,
  };
}

/**
 * Creates a validation error response (400 Bad Request)
 *
 * @param message - Validation error message
 * @returns Error response object with 400 status code
 *
 * @example
 * ```typescript
 * const { response, statusCode } = validationError('Description is required');
 * res.status(statusCode).json(response);
 * ```
 */
export function validationError(message: string): ErrorResponseData {
  return errorResponse(message, 400);
}

/**
 * Creates a not found error response (404 Not Found)
 *
 * @param resource - Name of the resource that wasn't found
 * @returns Error response object with 404 status code
 *
 * @example
 * ```typescript
 * const { response, statusCode } = notFoundError('Task');
 * res.status(statusCode).json(response);
 * // Returns 404: { success: false, error: 'Task not found' }
 * ```
 */
export function notFoundError(resource: string): ErrorResponseData {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Creates an internal server error response (500 Internal Server Error)
 *
 * @param error - Error object or message
 * @returns Error response object with 500 status code
 *
 * @example
 * ```typescript
 * const { response, statusCode } = serverError(error);
 * res.status(statusCode).json(response);
 * ```
 */
export function serverError(error: Error | string): ErrorResponseData {
  const message = error instanceof Error ? error.message : error || 'Internal server error';
  return errorResponse(message, 500);
}
