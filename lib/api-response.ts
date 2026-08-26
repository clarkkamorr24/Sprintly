import { ERROR_CODES, isAppError, ValidationError } from "@/lib/errors";
import type { ApiError, ApiResponse, Paginated } from "@/types/api";

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(error: ApiError): ApiResponse<never> {
  return { success: false, error };
}

export function paginate<T>(
  items: readonly T[],
  total: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return { items, total, page, pageSize };
}

interface NormalizedError {
  readonly error: ApiError;
  readonly status: number;
}

export function normalizeError(error: unknown, context: string): NormalizedError {
  if (isAppError(error)) {
    const apiError: ApiError =
      error instanceof ValidationError
        ? { code: error.code, message: error.message, fieldErrors: error.fieldErrors }
        : { code: error.code, message: error.message };

    return { error: apiError, status: error.status };
  }

  console.error(`[${context}] Unhandled error:`, error);

  return {
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Something went wrong. Please try again.",
    },
    status: 500,
  };
}

export async function handleRoute<T>(
  context: string,
  handler: () => Promise<T>
): Promise<Response> {
  try {
    const data = await handler();
    return Response.json(ok(data));
  } catch (error) {
    const { error: apiError, status } = normalizeError(error, context);
    return Response.json(fail(apiError), { status });
  }
}

export async function handleAction<T>(
  context: string,
  handler: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    return ok(await handler());
  } catch (error) {
    const { error: apiError } = normalizeError(error, context);
    return fail(apiError);
  }
}
