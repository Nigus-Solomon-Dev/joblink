/** Server response envelope produced by `backend/src/utils/apiResponse.js`. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  statusCode: number;
  timestamp: string;
  meta?: PaginationMeta | null;
}

/** Pagination metadata returned by the backend list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Normalized client-side API error. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}