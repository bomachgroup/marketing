export const API_PREFIX = "/api/v1";
export const SESSION_ESTABLISHED_KEY = "bomach:session-established";
export const SESSION_EXPIRED_EVENT = "bomach:session-expired";
const LEGACY_AUTH_KEYS = [
  "bomach_access_token_v1",
  "bomach_refresh_token_v1",
  "bomach_access_token",
  "bomach_refresh_token",
  "bomachOS_v3_auth",
  "bomach_api_base_url",
  "apiBaseUrl",
  "backendUrl",
];
export const BROWSER_REQUEST_HEADER = "X-Bomach-Request";
export const BROWSER_REQUEST_VALUE = "browser";

let refreshPromise: Promise<boolean> | null = null;

export function clearLegacyStoredAuth(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_AUTH_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Browser storage is not required for cookie authentication.
  }
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function readResponseBody(response: Response): Promise<{ data?: unknown; error?: string }> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("json")) {
    await response.text();
    if (contentType.includes("html")) {
      return {
        error: `The backend returned HTML instead of the expected JSON response (HTTP ${response.status}).`,
      };
    }
    return { error: `The backend returned a non-JSON response (HTTP ${response.status}).` };
  }

  try {
    return { data: await response.json() };
  } catch {
    return { error: `The backend returned invalid JSON (HTTP ${response.status}).` };
  }
}

function humanizeFieldName(field: string) {
  return field
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseFieldMessageString(value: string) {
  const parts = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  const parsed = parts.map((part) => {
    const match = part.match(/^([\w.\s-]+):\s*(.+)$/);
    if (!match) return part;
    return `${humanizeFieldName(match[1])}: ${match[2].trim()}`;
  });

  return parsed.join(" ");
}

export function parseApiError(err: unknown): string {
  if (!err) return "An unexpected error occurred.";

  if (typeof err === "string") {
    const trimmed = err.trim();
    if (!trimmed) return "An unexpected error occurred.";

    // Try to parse stringified JSON / Python dict strings like "{'email': ['Lead with this Email already exists.']}"
    try {
      const parsed = JSON.parse(trimmed);
      return parseApiError(parsed);
    } catch {
      if (/^[{[]/.test(trimmed)) {
        try {
          const sanitized = trimmed.replace(/'/g, '"');
          const parsed = JSON.parse(sanitized);
          return parseApiError(parsed);
        } catch {
          /* fall through to text parsing */
        }
      }

      const fieldMessage = parseFieldMessageString(trimmed);
      if (fieldMessage) return fieldMessage;

      const match = trimmed.match(
        /['"]?[\w.]+['"]?:\s*\[?['"]([^'"]+)['"]?\]?/,
      );
      if (match) return match[1];
      return trimmed;
    }
  }

  if (typeof err === "object") {
    if (Array.isArray(err)) {
      return err.map(parseApiError).join(" ");
    }
    const record = err as Record<string, unknown>;
    if (record.detail) {
      return parseApiError(record.detail);
    }
    if (record.message) {
      return parseApiError(record.message);
    }
    if (record.error) {
      return parseApiError(record.error);
    }
    if (record.non_field_errors) {
      return parseApiError(record.non_field_errors);
    }

    // Object mapping field errors e.g. { email: ["Already exists"], phone: ["Invalid"] }.
    const messages: string[] = [];
    for (const [field, val] of Object.entries(record)) {
      const parsedValue = parseApiError(val);
      if (parsedValue) {
        messages.push(`${humanizeFieldName(field)}: ${parsedValue}`);
      }
    }
    if (messages.length > 0) return messages.join(" ");
  }

  return String(err);
}

function shouldAttemptRefresh(endpoint: string): boolean {
  const normalized = endpoint.replace(/^\/api\/v1/, "");
  return ![
    "/auth/browser/login",
    "/auth/browser/verify-2fa",
    "/auth/browser/refresh",
    "/auth/browser/logout",
  ].some((authEndpoint) => normalized.startsWith(authEndpoint));
}

function announceExpiredSession(): void {
  if (typeof window === "undefined") return;
  try {
    const hadSession = window.sessionStorage.getItem(SESSION_ESTABLISHED_KEY) === "1";
    window.sessionStorage.removeItem(SESSION_ESTABLISHED_KEY);
    if (hadSession) window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  } catch {
    // Session storage is optional; the auth provider still handles request failures.
  }
}

async function refreshBrowserSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_PREFIX}/auth/browser/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          [BROWSER_REQUEST_HEADER]: BROWSER_REQUEST_VALUE,
        },
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) return true;
      if ([400, 401, 403].includes(response.status)) announceExpiredSession();
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function normalizeEndpoint(endpoint: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(endpoint)) {
    throw new Error("Marketing API requests must use the shared Bomach host.");
  }

  const queryIndex = endpoint.indexOf("?");
  const rawPath = queryIndex === -1 ? endpoint : endpoint.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : endpoint.slice(queryIndex);
  let path = rawPath === API_PREFIX || rawPath.startsWith(`${API_PREFIX}/`)
    ? rawPath.slice(API_PREFIX.length)
    : rawPath;
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.includes("/auth/") && !path.includes(".") && !path.endsWith("/")) path += "/";
  return `${API_PREFIX}${path}${query}`;
}

function requestHeaders(options: RequestInit, isMultipart = false): Headers {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!isMultipart && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    headers.set(BROWSER_REQUEST_HEADER, BROWSER_REQUEST_VALUE);
  }
  return headers;
}

async function sendRequest(endpoint: string, options: RequestInit): Promise<Response> {
  const url = normalizeEndpoint(endpoint);
  const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
  const init: RequestInit = {
    ...options,
    headers: requestHeaders(options, isMultipart),
    credentials: "include",
    cache: "no-store",
  };
  let response = await fetch(url, init);

  if (response.status === 401 && shouldAttemptRefresh(endpoint)) {
    const refreshed = await refreshBrowserSession();
    if (refreshed && !options.signal?.aborted) {
      response = await fetch(url, { ...init, headers: requestHeaders(options, isMultipart) });
    }
    if (response.status === 401) announceExpiredSession();
  }

  return response;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  try {
    const isMultipart = typeof FormData !== "undefined" && options.body instanceof FormData;
    const response = retryOnUnauthorized
      ? await sendRequest(endpoint, options)
      : await fetch(normalizeEndpoint(endpoint), {
          ...options,
          headers: requestHeaders(options, isMultipart),
          credentials: "include",
          cache: "no-store",
        });

    const status = response.status;
    if (status === 204) {
      return { status, data: null as T };
    }

    const parsedBody = await readResponseBody(response);
    if (parsedBody.error) {
      return { status, error: parsedBody.error };
    }
    const data = parsedBody.data as T;
    if (!response.ok) {
      const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
      const rawError =
        body.error || body.detail || body.message || `HTTP Error ${status}`;
      return {
        status,
        error: parseApiError(rawError),
      };
    }

    return { status, data };
  } catch (err: unknown) {
    return {
      status: 500,
      error: parseApiError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please check your network and try again.",
      ),
    };
  }
}

// Multipart requests must let the browser set Content-Type with the boundary.
export async function apiFormRequest<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  try {
    const requestOptions: RequestInit = {
      ...options,
      method: options.method || "POST",
      body: formData,
    };
    const response = retryOnUnauthorized
      ? await sendRequest(endpoint, requestOptions)
      : await fetch(normalizeEndpoint(endpoint), {
          ...requestOptions,
          headers: requestHeaders(requestOptions, true),
          credentials: "include",
          cache: "no-store",
        });

    const status = response.status;
    if (status === 204) {
      return { status, data: null as T };
    }

    const parsedBody = await readResponseBody(response);
    if (parsedBody.error) {
      return { status, error: parsedBody.error };
    }
    const data = parsedBody.data as T;
    if (!response.ok) {
      const body = data && typeof data === "object" ? data as Record<string, unknown> : {};
      const rawError =
        body.error || body.detail || body.message || `HTTP Error ${status}`;
      return {
        status,
        error: parseApiError(rawError),
      };
    }

    return { status, data };
  } catch (err: unknown) {
    return {
      status: 500,
      error: parseApiError(
        err instanceof Error
          ? err.message
          : "Connection failed. Please check your network and try again.",
      ),
    };
  }
}
