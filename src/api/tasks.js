import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

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

// Confirmed: task.status is {id, name}, ids 1-5. Sends the numeric target
// status id. Field name ("status" vs "status_id") for this specific action
// endpoint is still unverified — correct once tested.
export function updateTaskStatus(id, statusId) {
  return request(`/api/processes/simpletask/${id}/update_status/`, {
    method: 'POST',
    body: { status: statusId },
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

// Temporary discovery call — GET the blank comment form the same way we did
// for create-task, to read its real field names instead of guessing further
// (the POST guess crashed the server with a bare 500, no traceback exposed).
export function getCommentCreateForm() {
  return request('/api/bpm/comment/create/');
}

// Task.comments is a ManyToManyField on the task model itself (per field_types
// on a real task response), not a simple FK — the exact body field name this
// generic /api/bpm/comment/create/ endpoint expects is still unverified.
export function createComment(taskId, text) {
  return request('/api/bpm/comment/create/', {
    method: 'POST',
    body: { task: taskId, text },
  });
}
