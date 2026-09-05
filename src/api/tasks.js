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

export async function getTaskAttachments(taskId) {
  return unwrapList(await request(`/api/bpm/attachment/simpletask/${taskId}/`));
}

export function updateTaskStatus(id, statusId) {
  return request(`/api/processes/simpletask/${id}/update_status/`, {
    method: 'POST',
    body: { status_id: statusId },
  });
}

// Same endpoint toggles: calling it on an already-favorited task un-favorites it.
export function toggleTaskFavorite(taskId, userId) {
  return request('/api/processes/simpletask/addToFavorites/', {
    method: 'POST',
    body: { task: taskId, user: userId },
  });
}

export function getTaskCreateForm() {
  return request('/api/processes/simpletask/create/');
}

// Shared candidate list for both assistants (co-assignees) and spectators (watchers).
export async function getProjectUsers(projectId) {
  const data = await request(`/api/accounts/users_by_field/auto/?project=${projectId}`);
  return (data?.results ?? []).map((r) => ({ id: r.value, label: r.label }));
}

export function createTask({
  title,
  description,
  project,
  assignee,
  position,
  deadline,
  priority,
  newFiles = [],
  tags = [],
  assistants = [],
  spectators = [],
}) {
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
      tags,
      assistants,
      spectators,
      // Files are embedded inline (base64 data URLs), not uploaded separately.
      new_files: newFiles,
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
