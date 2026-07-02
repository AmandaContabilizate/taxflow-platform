import { cookies } from "next/headers";
import { getBaseUrl, type ApiType } from "./apiUrls";

// =============================================================
// Errores
// =============================================================

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: unknown;
  url: string;

  constructor(opts: {
    message: string;
    status: number;
    statusText: string;
    body: unknown;
    url: string;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.statusText = opts.statusText;
    this.body = opts.body;
    this.url = opts.url;
  }
}

type RequestOptions = Omit<RequestInit, "method" | "body" | "headers"> & {
  headers?: Record<string, string>;
};

// =============================================================
// Headers helpers
// =============================================================

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");
  return authToken ? { Authorization: `Bearer ${authToken.value}` } : {};
}

function isFormData(body: unknown): body is FormData {
  return (
    !!body &&
    typeof (body as Record<string, unknown>).append === "function" &&
    typeof (body as Record<string, unknown>).getAll === "function"
  );
}

// =============================================================
// Core request
// =============================================================

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  opts: {
    body?: unknown;
    apiType?: ApiType;
    auth?: boolean;
    options?: RequestOptions;
  } = {},
): Promise<T> {
  const { body, apiType = "default", auth = true, options } = opts;

  const url = `${getBaseUrl(apiType)}${endpoint}`;
  const usingFormData = isFormData(body);

  const headers: Record<string, string> = {
    ...(auth ? await buildAuthHeaders() : {}),
    ...(usingFormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers ?? {}),
  };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    payload = usingFormData ? (body as BodyInit) : JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
    ...options,
  });

  // Read body once as text — más seguro con respuestas vacías o no-JSON.
  const rawText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown = rawText;
  if (contentType.includes("application/json") && rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    // Distintos formatos de error del backend: `error` (respuestas custom),
    // ProblemDetails `detail` (específico) y `title` (genérico, p. ej. "Not
    // Found"). Preferimos el mensaje más específico disponible.
    const message =
      typeof data === "string"
        ? data
        : (data as { message?: string; error?: string; detail?: string; title?: string })?.message ??
        (data as { error?: string })?.error ??
        (data as { detail?: string })?.detail ??
        (data as { title?: string })?.title ??
        response.statusText;
    throw new ApiError({
      message: message || `HTTP ${response.status}`,
      status: response.status,
      statusText: response.statusText,
      body: data,
      url,
    });
  }

  return data as T;
}

// =============================================================
// Public API
// =============================================================

export const fetchGet = <T>(
  endpoint: string,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("GET", endpoint, { apiType, options });

export const fetchPost = <T>(
  endpoint: string,
  body?: unknown,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("POST", endpoint, { body, apiType, options });

export const fetchPut = <T>(
  endpoint: string,
  body?: unknown,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("PUT", endpoint, { body, apiType, options });

export const fetchPatch = <T>(
  endpoint: string,
  body?: unknown,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("PATCH", endpoint, { body, apiType, options });

export const fetchDelete = <T>(
  endpoint: string,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("DELETE", endpoint, { apiType, options });

export const fetchGetPublic = <T>(
  endpoint: string,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("GET", endpoint, { apiType, auth: false, options });

export const fetchPostPublic = <T>(
  endpoint: string,
  body?: unknown,
  apiType: ApiType = "default",
  options?: RequestOptions,
) => request<T>("POST", endpoint, { body, apiType, auth: false, options });

export async function fetchPostMultipart<T>(
  endpoint: string,
  formData: FormData,
  apiType: ApiType = "default",
  options?: RequestOptions,
): Promise<T> {
  return request<T>("POST", endpoint, { body: formData, apiType, options });
}

export async function fetchGetBlob(
  endpoint: string,
  apiType: ApiType = "default",
): Promise<{ blob: Blob; filename?: string }> {
  const url = `${getBaseUrl(apiType)}${endpoint}`;
  const headers = await buildAuthHeaders();

  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError({
      message: errorText || `HTTP ${response.status}`,
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      url,
    });
  }

  const cd = response.headers.get("content-disposition");
  let filename: string | undefined;
  if (cd) {
    const star = /filename\*=UTF-8''([^;\n]+)/i.exec(cd);
    if (star?.[1]) {
      try {
        filename = decodeURIComponent(star[1].replace(/['"]/g, ""));
      } catch {
        filename = star[1];
      }
    } else {
      const m = /filename="?([^";]+)"?/i.exec(cd);
      if (m?.[1]) filename = m[1];
    }
  }

  return { blob: await response.blob(), filename };
}
