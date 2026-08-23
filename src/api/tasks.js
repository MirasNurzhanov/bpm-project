import { request } from './client';
import { unwrapList } from '../utils/unwrapList';
import { escapeHtml } from '../utils/format';

export async function getAssignedTasks() {
  return unwrapList(await request('/api/processes/simpletask/me/assigned/'));
}

export async function getCreatedTasks() {
  return unwrapList(await request('/api/processes/simpletask/me/created/'));
}

// Confirmed: single-task GET wraps the task under {"object": {...}} — unwrap it.
export async function getTask(id) {
  const data = await request(`/api/processes/simpletask/${id}/`);
  return data?.object ?? data;
}

// Real task data has the raw FK field as "status_id" (not "status" — that's
// the nested serialized {id,name} relation) — trying that exact field name
// next, since {status: id} produced a bare, unhelpful 400.
export function updateTaskStatus(id, statusId) {
  return request(`/api/processes/simpletask/${id}/update_status/`, {
    method: 'POST',
    body: { status_id: statusId },
  });
}

// GET on the create endpoint to read the blank form (field choices for
// project/assignee/position — this API embeds live choices in form metadata,
// confirmed via the 400 response from a real submit attempt).
export function getTaskCreateForm() {
  return request('/api/processes/simpletask/create/');
}

// Confirmed required via a real 400 response: title, description, project,
// priority (int 1-5), and either assignee or position. Field is "deadline",
// not "due_date".
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

// Confirmed via the web app's own Network tab: comments for a task are a
// separate list endpoint, not embedded in the task detail response.
export async function getComments(taskId) {
  return unwrapList(await request(`/api/bpm/comment/simpletask/${taskId}/`));
}

// Confirmed via the web app's own network request: comments use a generic
// content_type/object_id pair (not a "task" FK), and text is HTML from a rich
// text editor — plain text gets wrapped in <p> to match, with entities
// escaped first since our composer is a plain TextInput, not a rich editor.
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
