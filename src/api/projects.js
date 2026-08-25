import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

export async function getProjects() {
  return unwrapList(await request('/api/bpm/project/'));
}

export async function getProject(id) {
  const data = await request(`/api/bpm/project/${id}/`);
  return data?.object ?? data;
}

export async function getProjectTasks(id) {
  return unwrapList(await request(`/api/processes/project/${id}/tasks/`));
}

export function getProjectCreateForm() {
  return request('/api/bpm/project/create/');
}

export function createProject({ name, slug, company, responsible, members }) {
  return request('/api/bpm/project/create/', {
    method: 'POST',
    body: {
      name,
      slug,
      company,
      responsible,
      members,
      current_task_num: 1,
    },
  });
}
