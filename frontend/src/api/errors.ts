export type FieldErrors = Record<string, string[]>;

export type ParsedApiError = {
  message: string;
  fieldErrors: FieldErrors;
  status?: number;
};

function looksLikeHtml(s: string) {
  const t = s.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("<body");
}

export function parseApiError(err: unknown): ParsedApiError {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: any };
  };

  // No response => real network/CORS/server down
  if (!e.response) {
    return {
      message: "Network error. Please check your connection and try again.",
      fieldErrors: {},
    };
  }

  const status = e.response.status;
  const data = e.response.data;

  if (typeof data === "string" && looksLikeHtml(data)) {
    return {
      message: `Request failed (${status}). Endpoint not found or wrong URL.`,
      fieldErrors: {},
      status,
    };
  }

  const details = data?.error?.details;

  const fieldErrors: FieldErrors =
    (details && typeof details === "object" ? details : data?.errors) ?? {};

  const message =
    (Array.isArray(details?.detail) && details.detail[0]) ||
    data?.detail ||
    data?.error?.code ||
    e.message ||
    "Request failed. Please try again.";

  return { message, fieldErrors, status };
}