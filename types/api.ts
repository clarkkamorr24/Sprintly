import type { ErrorCode } from "@/lib/errors";

export interface ApiError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
}

export type ApiResponse<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ApiError };

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}
