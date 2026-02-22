import type { ApiError } from "./types";

export type FieldErrors = Record<string, string[]>;

export type ParsedApiError = {
  message: string;              // human-friendly message
  fieldErrors: FieldErrors;     // field-level errors (title/body/tags...)
  status?: number;
};

export function parseApiError(err: unknown): ParsedApiError {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: ApiError | any };
    request?: any;
  };

  const status = e.response?.status;
  const data = e.response?.data as ApiError | undefined;

  // No response => network/CORS/server down
  if (!e.response) {
    return {
      message: "Network error. Please check your connection and try again.",
      fieldErrors: {},
    };
  }

  // If backend uses our standardized shape
  const detail = data?.detail;
  const errors = data?.errors ?? {};

  // Fallbacks (sometimes DRF returns {detail:"..."} only, or plain strings)
  const message =
    detail ||
    (typeof e.response?.data === "string" ? e.response.data : "") ||
    (e.message || "Request failed. Please try again.");

  return {
    message,
    fieldErrors: errors,
    status,
  };
}