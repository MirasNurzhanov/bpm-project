export const PRIORITY_LABELS = ['Не задан', 'Очень низкий', 'Низкий', 'Средний', 'Высокий', 'Очень высокий'];

export function taskPriorityLevel(task) {
  return typeof task?.priority_id === 'number' ? task.priority_id : 0;
}

export function priorityLabel(level) {
  return PRIORITY_LABELS[level] ?? PRIORITY_LABELS[0];
}
