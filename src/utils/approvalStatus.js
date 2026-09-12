const STATUS_LABELS = {
  1: 'Черновик',
  2: 'На согласовании',
  3: 'Согласовано',
  4: 'Отклонено',
};

const STATUS_TONES = {
  1: 'muted',
  2: 'accent',
  3: 'success',
  4: 'danger',
};

export const APPROVAL_DRAFT = 1;
export const APPROVAL_PENDING = 2;
export const APPROVAL_APPROVED = 3;
export const APPROVAL_REJECTED = 4;

export function approvalStatusId(process) {
  return process?.status?.id ?? process?.status_id ?? null;
}

export function approvalStatusInfo(process) {
  const id = approvalStatusId(process);
  return {
    label: STATUS_LABELS[id] ?? process?.status?.name ?? '—',
    tone: STATUS_TONES[id] ?? 'muted',
  };
}
