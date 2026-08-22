import { request } from './client';

// Field names are a best guess (Django's default session-login field is
// "username" regardless of the display label) — correct after a real test login.
export function login(username, password) {
  return request('/api/accounts/login/', {
    method: 'POST',
    body: { username, password },
    skipAuthRedirect: true,
  });
}

export function fetchProfile({ skipAuthRedirect = false } = {}) {
  return request('/api/accounts/profile/', { skipAuthRedirect });
}

export function logout() {
  return request('/api/accounts/logout/', { method: 'POST', skipAuthRedirect: true });
}
