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

// The model field is `approval_status` (confirmed from the create form's
// `instance` dict: approval_status_id). Keep `status`/`status_id` as a
// fallback in case a list serializer names it differently.
export function approvalStatusId(process) {
  return (
    process?.approval_status?.id ??
    process?.approval_status_id ??
    process?.status?.id ??
    process?.status_id ??
    null
  );
}

export function approvalStatusInfo(process) {
  const id = approvalStatusId(process);
  return {
    label: STATUS_LABELS[id] ?? process?.approval_status?.name ?? process?.status?.name ?? '—',
    tone: STATUS_TONES[id] ?? 'muted',
  };
}
