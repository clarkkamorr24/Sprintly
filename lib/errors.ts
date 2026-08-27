export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = ERROR_CODES.VALIDATION_ERROR;
  readonly status = 400;
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>;

  constructor(
    message = "The submitted data is invalid.",
    fieldErrors: Record<string, readonly string[]> = {}
  ) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends AppError {
  readonly code = ERROR_CODES.UNAUTHORIZED;
  readonly status = 401;

  constructor(message = "You must be signed in to do that.") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = ERROR_CODES.FORBIDDEN;
  readonly status = 403;

  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = ERROR_CODES.NOT_FOUND;
  readonly status = 404;

  constructor(message = "The requested resource was not found.") {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly code = ERROR_CODES.CONFLICT;
  readonly status = 409;

  constructor(message = "That action conflicts with the current state.") {
    super(message);
  }
}

export class RateLimitError extends AppError {
  readonly code = ERROR_CODES.RATE_LIMITED;
  readonly status = 429;

  constructor(message = "Too many requests. Please try again shortly.") {
    super(message);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export class InternalError extends AppError {
  readonly code = ERROR_CODES.INTERNAL_ERROR;
  readonly status = 500;

  constructor(message = "Something went wrong. Please try again.") {
    super(message);
  }
}
