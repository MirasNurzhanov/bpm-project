import { getApiBaseUrl } from './serverUrl';

export class ApiError extends Error {
  constructor(status, data) {
    super((data && (data.detail || data.message)) || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function request(path, { method = 'GET', body, skipAuthRedirect = false } = {}) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? safeParseJson(text) : null;

  if (__DEV__) {
    if (data === null && text) {
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

export function formatApiErrorMessage(error, fallback = 'Не удалось выполнить запрос') {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== 'object') return fallback;
  const errors = error.data.form?.errors ?? error.data.errors ?? error.data;
  if (!errors || typeof errors !== 'object') return fallback;
  const parts = Object.entries(errors)
    .map(([field, value]) => {
      const message = flattenErrorValue(value);
      if (!message) return null;
      return field === 'detail' || field === 'non_field_errors' || field === '__all__' ? message : `${field}: ${message}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join('\n') : fallback;
}

function flattenErrorValue(value) {
  if (Array.isArray(value)) return value.map(flattenErrorValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return Object.values(value).map(flattenErrorValue).filter(Boolean).join(', ');
  if (value == null) return '';
  return String(value);
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
