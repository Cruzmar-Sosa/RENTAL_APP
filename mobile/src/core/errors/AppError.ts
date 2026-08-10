import { ErrorCode } from './codes';

export interface ErrorContext {
  readonly [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number | undefined;
  public readonly context: ErrorContext | undefined;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    httpStatus?: number,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.context = context;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotImplementedError extends AppError {
  constructor(featureName: string) {
    super(
      `Feature '${featureName}' is not implemented yet. Contracts first rule in effect.`,
      ErrorCode.NOT_IMPLEMENTED,
      501,
      { featureName }
    );
    this.name = 'NotImplementedError';
  }
}
