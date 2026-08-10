import { AppError } from './AppError';
import { ErrorCode } from './codes';

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, undefined, { originalError: error.name });
  }
  return new AppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR, undefined, { raw: error });
}
