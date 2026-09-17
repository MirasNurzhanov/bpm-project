import { request } from './client';
import { unwrapList } from '../utils/unwrapList';

// "Бизнес процессы" / document-approval API. All endpoints below live under
// /api/processes/ except the notification badge one, which is /api/bpm/.
const BASE = '/api/processes/document-approval';

// --- Lists -----------------------------------------------------------------
export async function getCreatedApprovals() {
  return unwrapList(await request(`${BASE}/created/`));
}
export async function getActiveApprovals() {
  return unwrapList(await request(`${BASE}/active/`));
}
export async function getNeedApprovalApprovals() {
  return unwrapList(await request(`${BASE}/need-approval/`));
}
export async function getSubordinateApprovals() {
  return unwrapList(await request(`${BASE}/subordinates/`));
}
export async function getCompletedApprovals() {
  return unwrapList(await request(`${BASE}/completed/`));
}
export async function getDraftApprovals() {
  return unwrapList(await request(`${BASE}/draft/`));
}

// Confirmed via a real request: /api/bpm/attachment/approvaldocument/<id>/
// (same shape/convention as task attachments: /api/bpm/attachment/simpletask/<id>/)
export async function getApprovalAttachments(id) {
  return unwrapList(await request(`/api/bpm/attachment/approvaldocument/${id}/`));
}

// --- Single process ----------------------------------------------------------
export async function getApproval(id) {
  const data = await request(`${BASE}/${id}/`);
  return data?.object ?? data;
}

export function getApprovalCreateForm() {
  return request(`${BASE}/create/`);
}

export function createApproval(body) {
  return request(`${BASE}/create/`, { method: 'POST', body });
}

export function getApprovalUpdateForm(id) {
  return request(`${BASE}/${id}/update/`);
}

export function updateApproval(id, body) {
  return request(`${BASE}/${id}/update/`, { method: 'POST', body });
}

// GET with a side effect (per spec, not DELETE) — only removes processes that
// are mine and still in "Черновик". ids: array of numbers/strings.
export function deleteApprovals(ids) {
  return request(`${BASE}/delete/?selected=${ids.join(',')}`);
}

// --- Single-field edits ------------------------------------------------------
export function updateApprovalTitle(id, title) {
  return request(`${BASE}/${id}/update/title/`, { method: 'POST', body: { title } });
}
export function updateApprovalDescription(id, description) {
  return request(`${BASE}/${id}/update/description/`, { method: 'POST', body: { description } });
}
// NOTE: no trailing slash — matches the spec exactly.
export function updateApprovalMoneyAmount(id, moneyAmount) {
  return request(`${BASE}/${id}/update/money_amount`, {
    method: 'POST',
    body: { money_amount: moneyAmount },
  });
}

// --- Status / stage / history ------------------------------------------------
// Status ids: 1 Черновик, 2 На согласовании, 3 Согласовано, 4 Отклонено.
export async function getStageHistory(id) {
  return unwrapList(await request(`${BASE}/${id}/stage_history/`));
}

export function updateApprovalStatus(id, statusId) {
  return request(`${BASE}/${id}/update_status/`, {
    method: 'POST',
    body: { status_id: statusId },
  });
}

// Revoke a rejected stage's decision (only the rejector, the position's holder,
// or someone delegated that position via "Исполняющий обязанности" can do this).
export function revokeStageDecision(id, stageId) {
  return request(`${BASE}/${id}/update_stage_last/`, {
    method: 'POST',
    body: { stage_id: stageId },
  });
}

// Approve or reject the current stage. comment (optional) is stored on the
// stage's history entry and also posted as a process comment.
export function decideStage(id, { stageId, approve, comment }) {
  return request(`${BASE}/${id}/update_stage/`, {
    method: 'POST',
    body: { stage_id: stageId, approve_bool: approve, comment: comment ?? '' },
  });
}

// --- Process types ------------------------------------------------------------
// Type: { id, name, str ("<name> (<company>)"), company, first_stage_id,
// payment_status, subject_required, jobs_positions, author }. Creating a type
// does NOT attach an approval stage chain — first_stage_id comes back null;
// that's a separate, not-yet-documented mechanism.
export async function getApprovalTypes() {
  return unwrapList(await request('/api/processes/document-approval-types/'));
}
export async function getApprovalTypesSimple() {
  return unwrapList(await request('/api/processes/document-approval-types/simple/'));
}

export function getApprovalTypeCreateForm() {
  return request('/api/processes/document-approval-types/create/');
}

// --- Approval stages (the actual approver chain for a type) -----------------
// A type's stages form a chain via previous_approval_stage (null = first
// stage). Creating a type does NOT create any stages; they're added one at a
// time here, each pointing at the previous one.
export function getApprovalStageCreateForm(typeId) {
  return request(`/api/processes/document-approval-stages/${typeId}/create/`);
}

export function createApprovalStage(typeId, {
  name,
  previousStageId = null,
  position,
  moneyChange = false,
  approvalType = 'sogl', // 'sogl' Согласование | 'ispl' Исполнение
  author = null,
}) {
  return request(`/api/processes/document-approval-stages/${typeId}/create/`, {
    method: 'POST',
    body: {
      name,
      doc_type: typeId,
      previous_approval_stage: previousStageId,
      position,
      money_change: moneyChange,
      approval_type: approvalType,
      author,
    },
  });
}

export async function getApprovalTypeStages(typeId) {
  return unwrapList(await request(`/api/processes/document-approval-types/${typeId}/stages/`));
}

export function createApprovalType({
  name,
  company,
  paymentStatus = false,
  subjectRequired = false,
  jobsPositions = [],
  author = null,
}) {
  return request('/api/processes/document-approval-types/create/', {
    method: 'POST',
    body: {
      name,
      company,
      payment_status: paymentStatus,
      subject_required: subjectRequired,
      jobs_positions: jobsPositions,
      author,
    },
  });
}

// --- Badges / notifications --------------------------------------------------
// NOTE: no trailing slash — matches the spec exactly. -> { all, toApprove }
export function getApprovalToApproveCount() {
  return request('/api/processes/document-approval/to_approve_count');
}

// -> [{ count, notification_type, approval_status_id }]
// notification_type: 1 = process itself, 5 = new comment. approval_status_id:
// 2 На согласовании, 3 Согласовано, 4 Отклонено (drafts are excluded).
export function getApprovalUpdateNotifications() {
  return request('/api/bpm/approvaldocument/updatenotification/');
}
