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

const NEXT_STATUS_BY_ID = {
  1: { next: 2, ctaLabel: 'Взять в работу' },
  2: { next: 3, ctaLabel: 'Отправить на проверку' },
  3: { next: 4, ctaLabel: 'Завершить' },
};

export function nextStatusAction(task) {
  return NEXT_STATUS_BY_ID[task?.status?.id] ?? null;
}
