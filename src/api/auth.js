import { request } from './client';

export function login(username, password) {
  return request('/api/accounts/login/', {
    method: 'POST',
    body: { username, password },
    skipAuthRedirect: true,
  });
}

export async function fetchProfile({ skipAuthRedirect = false } = {}) {
  const data = await request('/api/accounts/profile/', { skipAuthRedirect });
  return data?.user ?? data;
}

export function logout() {
  return request('/api/accounts/logout/', { method: 'POST', skipAuthRedirect: true });
}
