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

// Confirmed: response wraps the user under {"user": {...}} — unwrap it. This
// also has direct position_name/department_name fields (unlike the nested
// position.job/position.department shape seen on other users elsewhere).
export async function fetchProfile({ skipAuthRedirect = false } = {}) {
  const data = await request('/api/accounts/profile/', { skipAuthRedirect });
  return data?.user ?? data;
}

export function logout() {
  return request('/api/accounts/logout/', { method: 'POST', skipAuthRedirect: true });
}
