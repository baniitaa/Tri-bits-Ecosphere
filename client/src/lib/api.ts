import { authStorage } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = "API_ERROR", details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.error?.message ?? "Request failed", payload.error?.code ?? "REQUEST_FAILED", payload.error?.details);
  }

  return payload;
}

export async function apiDownload(path: string, init: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers = new Headers(init.headers);
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = (await response.json()) as ApiResponse<never>;
    throw new ApiError(payload.error?.message ?? "Request failed", payload.error?.code ?? "REQUEST_FAILED", payload.error?.details);
  }

  return {
    blob: await response.blob(),
    filename: response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "download",
    contentType: response.headers.get("Content-Type") ?? "application/octet-stream"
  };
}
