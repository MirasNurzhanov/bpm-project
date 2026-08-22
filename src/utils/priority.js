// Confirmed via real API: priority_id is an integer 1-5 and priority is the
// already-translated Russian label for it — no more guessing needed here.
export const PRIORITY_LABELS = ['Не задан', 'Очень низкий', 'Низкий', 'Средний', 'Высокий', 'Очень высокий'];

export function taskPriorityLevel(task) {
  return typeof task?.priority_id === 'number' ? task.priority_id : 0;
}

export function priorityLabel(level) {
  return PRIORITY_LABELS[level] ?? PRIORITY_LABELS[0];
}
