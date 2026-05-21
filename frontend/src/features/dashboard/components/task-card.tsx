import type { TaskSummary } from "@/features/dashboard/types";
import {
  formatAssigneeNames,
  formatDateRange,
  getPriorityColor,
  isTaskOverdue,
} from "@/features/dashboard/utils";

type TaskCardProps = {
  canDrag: boolean;
  isDragging: boolean;
  onDragEnd: () => void;
  onDragStart: (task: TaskSummary) => void;
  onClick: (task: TaskSummary) => void;
  task: TaskSummary;
};

export function TaskCard({
  canDrag,
  isDragging,
  onDragEnd,
  onDragStart,
  onClick,
  task,
}: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const startedObjectives = task.objectives.filter((objective) => objective.started).length;

  return (
    <button
      className={`w-full rounded-[18px] border border-white/8 bg-[color:var(--panel-strong)] p-3 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 ${
        canDrag ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "scale-[0.98] opacity-55" : ""}`}
      draggable={canDrag}
      onDragEnd={onDragEnd}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(task.id));
        onDragStart(task);
      }}
      onClick={() => onClick(task)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.04em] text-white">{task.title}</h4>
        <span
          className="mt-1 h-3 w-3 rounded-full"
          style={{ backgroundColor: getPriorityColor(task.priority) }}
        />
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300">{task.description}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="line-clamp-1">{formatAssigneeNames(task.assignees)}</span>
        <span className={overdue ? "text-rose-300" : "text-slate-400"}>
          {formatDateRange(task.start_date, task.end_date)}
        </span>
      </div>
      {task.objectives.length ? (
        <p className="mt-1.5 text-xs text-slate-400">
          {startedObjectives}/{task.objectives.length} objectives started
        </p>
      ) : null}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#6f79ff,#4cd4aa)]"
          style={{ width: `${task.progress}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs text-slate-400">{task.progress}% complete</p>
    </button>
  );
}
