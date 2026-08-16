import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

import type { ApiResponse, Paginated, PaginationMeta } from "@/types/api";
import { ApiError } from "@/types/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Unwrap `{ success, data, ... }` envelopes into their payload. */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data;
}

/**
 * Unwrap a paginated envelope into `{ data, meta }`. The backend puts the
 * page of documents under `data` and the pagination info under `meta` (both
 * top-level fields of the envelope), so the plain `unwrap` would drop the
 * meta we need to render pagination controls.
 */
export function unwrapPaginated<T>(response: AxiosResponse<ApiResponse<T[]>>): Paginated<T> {
  return {
    data: response.data.data,
    meta: (response.data.meta ?? {
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    }) as PaginationMeta,
  };
}

function normalizeError(error: AxiosError<ApiResponse<unknown>>): ApiError {
  const statusCode = error.response?.status ?? 0;
  const serverMessage = error.response?.data?.message;
  const message = serverMessage
    ? String(serverMessage)
    : error.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : error.response
        ? "Something went wrong on the server."
        : "Cannot reach the server. Check your connection and try again.";

  return new ApiError(message, statusCode, error.response?.data);
}

type SessionExpiredHandler = () => void;
const sessionExpiredHandlers = new Set<SessionExpiredHandler>();

export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
}

function notifySessionExpired(): void {
  sessionExpiredHandlers.forEach((handler) => handler());
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, timeout: 15000 },
    );
    const token = response.data.data.accessToken;
    setAccessToken(token);
    return token;
  } catch {
    clearAccessToken();
    return null;
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const { response, config } = error;

    if (!response || !config) {
      throw normalizeError(error);
    }

    const isAuthCall = typeof config.url === "string" && config.url.startsWith("/auth/");
    const shouldRefresh =
      response.status === 401 && !isAuthCall && !(config as RetriableConfig)._retry;

    if (shouldRefresh) {
      (config as RetriableConfig)._retry = true;

      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return http.request(config);
      }

      notifySessionExpired();
    }

    throw normalizeError(error);
  },
);
