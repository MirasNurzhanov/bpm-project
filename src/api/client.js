export const API_BASE_URL = 'https://bpm.dalasteppes.kz';

export class ApiError extends Error {
  constructor(status, data) {
    super((data && (data.detail || data.message)) || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

let unauthorizedHandler = null;

// AuthContext registers itself here so any request in the app can trigger a
// forced logout + redirect-to-login when the session cookie has expired,
// not just the boot-time check.
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function request(path, { method = 'GET', body, skipAuthRedirect = false } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      // The web app's browser sends these automatically; our fetch doesn't.
      // At least one server view (comment/create) 500s on a byte-identical
      // body without them — likely reads Referer/Origin server-side unguarded.
      Origin: API_BASE_URL,
      Referer: `${API_BASE_URL}/`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? safeParseJson(text) : null;

  if (__DEV__) {
    // Temporary while we verify real API shapes — remove once field names are confirmed.
    if (data === null && text) {
      // JSON parsing failed (likely an HTML error page / server traceback) —
      // log the raw text so we can actually see what the server said.
      console.log(`[api] ${method} ${path} -> ${response.status} (unparseable body)`, text.slice(0, 3000));
    } else {
      console.log(`[api] ${method} ${path} -> ${response.status}`, JSON.stringify(data));
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuthRedirect) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, data);
  }

  return data;
}

// DRF validation errors are usually {field: ["message", ...], ...} — flatten
// them into something readable instead of a generic "request failed" string.
export function formatApiErrorMessage(error, fallback = 'Не удалось выполнить запрос') {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') return fallback;
  const parts = Object.entries(error.data).map(([field, value]) => {
    const message = Array.isArray(value) ? value.join(', ') : String(value);
    return field === 'detail' || field === 'non_field_errors' ? message : `${field}: ${message}`;
  });
  return parts.length ? parts.join('\n') : fallback;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
