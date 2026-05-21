import type { TaskPriority, TaskStatus, ViewMode } from "@/features/dashboard/types";

export const VIEW_OPTIONS: Array<{ id: ViewMode; label: string }> = [
  { id: "kanban", label: "Kanban" },
  { id: "gantt", label: "Gantt" },
  { id: "list", label: "List" },
  { id: "team", label: "Team" },
];

export const STATUS_META: Record<TaskStatus, { label: string; hint: string }> = {
  todo: { label: "To Do", hint: "Queued work" },
  in_progress: { label: "In Progress", hint: "Currently active" },
  review: { label: "Review", hint: "Needs feedback" },
  done: { label: "Done", hint: "Shipped work" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "#6dd3ff" },
  medium: { label: "Medium", color: "#f4c96b" },
  high: { label: "High", color: "#ff6f91" },
};
