// Confirmed via real API: task.status is a nested object {id, name, order_num, ...}
// and the API already returns the Russian display name — we just map id -> tone/action.
// Known statuses (from the task-list filter form choices):
// 1 К выполнению, 2 В работе, 3 На проверке, 4 Завершена, 5 Отложено.
const TONE_BY_STATUS_ID = {
  1: 'success',
  2: 'accent',
  3: 'accent',
  4: 'muted',
  5: 'muted',
};

const DONE_STATUS_ID = 4;

export function isOverdue(task) {
  if (!task?.deadline) return false;
  if (task?.status?.id === DONE_STATUS_ID) return false;
  return new Date(task.deadline).getTime() < Date.now();
}

export function taskStatusInfo(task) {
  if (isOverdue(task)) return { label: 'Просрочена', tone: 'danger' };
  return {
    label: task?.status?.name ?? '—',
    tone: TONE_BY_STATUS_ID[task?.status?.id] ?? 'muted',
  };
}

// The next status id + CTA label for the primary status-transition button.
// Field name/shape for update_status's request body is still unverified —
// currently guessing {status: <id>}; correct once tested against the real endpoint.
const NEXT_STATUS_BY_ID = {
  1: { next: 2, ctaLabel: 'Взять в работу' },
  2: { next: 3, ctaLabel: 'Отправить на проверку' },
  3: { next: 4, ctaLabel: 'Завершить' },
};

export function nextStatusAction(task) {
  return NEXT_STATUS_BY_ID[task?.status?.id] ?? null;
}
