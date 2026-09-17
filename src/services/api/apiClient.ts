import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "./authTokenStore";

let cachedApiBaseUrl: string | null = null;

export function setApiBaseUrl(url: string) {
  if (!url) return;
  cachedApiBaseUrl = url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1\/?$/, "");
  try {
    sessionStorage.setItem("bomach_api_base_url", cachedApiBaseUrl);
    localStorage.setItem("bomach_api_base_url", cachedApiBaseUrl);
  } catch {}
}

export function extractSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const combined = new URLSearchParams(window.location.search || "");
  if (window.location.hash) {
    const qIdx = window.location.hash.indexOf("?");
    if (qIdx !== -1) {
      const hashParams = new URLSearchParams(
        window.location.hash.substring(qIdx),
      );
      hashParams.forEach((val, key) => {
        if (!combined.has(key)) {
          combined.set(key, val);
        }
      });
    }
  }
  return combined;
}

function isLiveShellOrigin(originOrUrl: string): boolean {
  const lower = originOrUrl.toLowerCase();
  return (
    lower.includes("bomachosapp") ||
    lower.includes("bomach-os-app") ||
    lower.includes("bomachauthapp") ||
    lower.includes("bomachauth.bgbot.app")
  );
}

export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  if (typeof window !== "undefined") {
    const searchParams = extractSearchParams();
    const override =
      searchParams.get("apiBaseUrl") ||
      searchParams.get("backendUrl") ||
      searchParams.get("apiUrl") ||
      searchParams.get("authBaseUrl");
    if (override) {
      const clean = override
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/api\/v1\/?$/, "");
      setApiBaseUrl(clean);
      return clean;
    }

    try {
      const stored =
        sessionStorage.getItem("bomach_api_base_url") ||
        localStorage.getItem("bomach_api_base_url");
      if (stored) {
        cachedApiBaseUrl = stored;
        return stored;
      }
    } catch {}

    const hostname = window.location.hostname.toLowerCase();
    const referrer = (document.referrer || "").toLowerCase();

    // The ONLY time live backend is used is when viewing from the live shell
    let isLiveEnvironment = isLiveShellOrigin(hostname) || isLiveShellOrigin(referrer);

    try {
      const ancestors = (window.location as any).ancestorOrigins;
      if (ancestors && ancestors.length > 0) {
        for (let i = 0; i < ancestors.length; i++) {
          if (isLiveShellOrigin(ancestors[i])) {
            isLiveEnvironment = true;
            break;
          }
        }
      }
    } catch {}

    if (isLiveEnvironment) {
      return "https://bomachauth.bgbot.app";
    }

    // In all other cases (standalone on its own, localhost, test shell), use test backend
    return "https://bomachauthtest.bgbot.app";
  }

  return "https://bomachauthtest.bgbot.app";
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

type RefreshTokenResponse = {
  access_token?: string;
};

let refreshPromise: Promise<string | null> | null = null;

function shouldAttemptRefresh(endpoint: string) {
  return ![
    "/api/v1/auth/login",
    "/api/v1/auth/verify-2fa",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
  ].some((authEndpoint) => endpoint.startsWith(authEndpoint));
}

async function fetchReadWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    return fetch(input, init).catch(() => {
      throw error;
    });
  }
}

export async function refreshAccessTokenFromCookie(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAccessToken();
    return null;
  }

  refreshPromise = fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        clearAccessToken();
        clearRefreshToken();
        return null;
      }

      const data = (await response.json()) as RefreshTokenResponse;
      if (!data.access_token) {
        clearAccessToken();
        return null;
      }

      setAccessToken(data.access_token);
      return data.access_token;
    })
    .catch(() => {
      clearAccessToken();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Most wrappers in this codebase consume broad backend response shapes and narrow them in transformers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEndpoint(endpoint: string): string {
  const [path, query] = endpoint.split("?");
  // Auth endpoints and files must not have trailing slashes
  if (path.includes("/auth/") || path.includes(".")) {
    return query ? `${path}?${query}` : path;
  }
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${normalizeEndpoint(endpoint)}`;

  try {
    const requestInit = {
      ...options,
      headers,
      credentials: options.credentials || "include",
    } satisfies RequestInit;
    const method = (options.method || "GET").toUpperCase();
    const response = await (method === "GET" || method === "HEAD"
      ? fetchReadWithRetry(url, requestInit)
      : fetch(url, requestInit));

    if (
      response.status === 401 &&
      retryOnUnauthorized &&
      shouldAttemptRefresh(endpoint)
    ) {
      const refreshedToken = await refreshAccessTokenFromCookie();
      if (refreshedToken) {
        return apiRequest<T>(endpoint, options, false);
      }
    }

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFormRequest<T = any>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {},
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${normalizeEndpoint(endpoint)}`;

  try {
    const response = await fetch(url, {
      ...options,
      method: options.method || "POST",
      body: formData,
      headers,
      credentials: options.credentials || "include",
    });

    if (
      response.status === 401 &&
      retryOnUnauthorized &&
      shouldAttemptRefresh(endpoint)
    ) {
      const refreshedToken = await refreshAccessTokenFromCookie();
      if (refreshedToken) {
        return apiFormRequest<T>(endpoint, formData, options, false);
      }
    }

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
