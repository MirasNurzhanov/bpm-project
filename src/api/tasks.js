import { request } from './client';
import { unwrapList } from '../utils/unwrapList';
import { escapeHtml } from '../utils/format';

export async function getAssignedTasks() {
  return unwrapList(await request('/api/processes/simpletask/me/assigned/'));
}

export async function getCreatedTasks() {
  return unwrapList(await request('/api/processes/simpletask/me/created/'));
}

export async function getTask(id) {
  const data = await request(`/api/processes/simpletask/${id}/`);
  return data?.object ?? data;
}

export function updateTaskStatus(id, statusId) {
  return request(`/api/processes/simpletask/${id}/update_status/`, {
    method: 'POST',
    body: { status_id: statusId },
  });
}

export function getTaskCreateForm() {
  return request('/api/processes/simpletask/create/');
}

export function createTask({ title, description, project, assignee, position, deadline, priority }) {
  return request('/api/processes/simpletask/create/', {
    method: 'POST',
    body: {
      title,
      description,
      project,
      assignee,
      position,
      deadline,
      priority,
    },
  });
}

export async function getComments(taskId) {
  return unwrapList(await request(`/api/bpm/comment/simpletask/${taskId}/`));
}

export function createComment(taskId, text) {
  return request('/api/bpm/comment/create/', {
    method: 'POST',
    body: {
      content_type: 'simpletask',
      object_id: taskId,
      text: `<p>${escapeHtml(text)}</p>`,
      attachments: [],
    },
  });
}
