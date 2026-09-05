import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

export async function getSubordinates() {
  return unwrapList(await request('/api/accounts/subordinates/'));
}

// Response: { tasks: [<task with history_status / history_status_date>], users: [{ id, name, position }] }
export async function getEmployeeEfficiency({ users, year, month }) {
  return request('/api/stats/employee-efficiency', {
    method: 'POST',
    body: { users, year, month },
  });
}
