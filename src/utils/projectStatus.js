const STATUS_MAP = {
  on_track: { label: 'В графике', tone: 'success' },
  in_progress: { label: 'В работе', tone: 'accent' },
  overdue: { label: 'Просрочен', tone: 'danger' },
  closed: { label: 'Закрыт', tone: 'muted' },
  completed: { label: 'Закрыт', tone: 'muted' },
};

export function hasProjectStatus(project) {
  return project?.status != null;
}

export function hasProjectProgress(project) {
  return typeof project?.progress === 'number' || Boolean(project?.tasks_total ?? project?.tasks_count);
}

export function projectStatusInfo(project) {
  const raw = project?.status ? String(project.status).toLowerCase() : '';
  return STATUS_MAP[raw] ?? { label: project?.status ?? '—', tone: 'muted' };
}

export function projectProgress(project) {
  if (typeof project?.progress === 'number') return project.progress;
  const total = project?.tasks_total ?? project?.tasks_count;
  const done = project?.tasks_done ?? project?.tasks_completed;
  if (total) return Math.round(((done ?? 0) / total) * 100);
  return 0;
}
