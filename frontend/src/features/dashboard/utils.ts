import { PRIORITY_META } from "@/features/dashboard/constants";
import type {
  TaskAssignee,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TaskWrite,
} from "@/features/dashboard/types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function dateInputValue(value: string) {
  return value.slice(0, 10);
}

export function groupTasksByStatus(tasks: TaskSummary[]) {
  return tasks.reduce<Record<TaskStatus, TaskSummary[]>>(
    (groups, task) => {
      groups[task.status].push(task);
      return groups;
    },
    {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    },
  );
}

export function getPriorityColor(priority: TaskPriority) {
  return PRIORITY_META[priority].color;
}

export function formatAssigneeNames(assignees: Pick<TaskAssignee, "name">[]) {
  return assignees.length ? assignees.map((assignee) => assignee.name).join(", ") : "Unassigned";
}

function getLocalDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isTaskOverdue(task: Pick<TaskSummary, "end_date" | "status">) {
  return task.status !== "done" && task.end_date.slice(0, 10) < getLocalDateKey();
}

export function toTaskWrite(task: TaskSummary): TaskWrite {
  return {
    project_id: task.project_id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee_ids: task.assignees.map((assignee) => assignee.id),
    objectives: task.objectives.map((objective) => ({
      title: objective.title,
      started: objective.started,
      assignee_ids: objective.assignees.map((assignee) => assignee.id),
    })),
    start_date: dateInputValue(task.start_date),
    end_date: dateInputValue(task.end_date),
    parent_task_id: task.parent_task_id,
    progress: task.progress,
    sort_order: task.sort_order,
  };
}

export function daysBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const milliseconds = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(milliseconds / (1000 * 60 * 60 * 24)) + 1);
}

export function buildTaskDraft(
  task: TaskSummary | null,
  projectId: number,
  nextSortOrder: number,
): TaskWrite {
  if (task) {
    return toTaskWrite(task);
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    project_id: projectId,
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_ids: [],
    objectives: [],
    start_date: today,
    end_date: today,
    parent_task_id: null,
    progress: 0,
    sort_order: nextSortOrder,
  };
}
