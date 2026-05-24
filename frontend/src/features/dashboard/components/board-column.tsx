import { TaskCard } from "@/features/dashboard/components/task-card";
import { STATUS_META } from "@/features/dashboard/constants";
import type {
  BoardColumn as BoardColumnType,
  TaskStatus,
  TaskSummary,
} from "@/features/dashboard/types";

type BoardColumnProps = {
  activeDragTaskId: number | null;
  canEdit: boolean;
  column: BoardColumnType;
  isDropTarget: boolean;
  onAdd: (status: BoardColumnType["id"]) => void;
  onDragEnd: () => void;
  onDragOverColumn: (status: TaskStatus) => void;
  onDragStart: (task: TaskSummary) => void;
  onDropTask: (status: TaskStatus) => void;
  onEdit: (task: TaskSummary) => void;
  tasks: TaskSummary[];
};

export function BoardColumn({
  activeDragTaskId,
  canEdit,
  column,
  isDropTarget,
  onAdd,
  onDragEnd,
  onDragOverColumn,
  onDragStart,
  onDropTask,
  onEdit,
  tasks,
}: BoardColumnProps) {
  return (
    <section
      className={`flex h-[calc(100vh-15rem)] min-h-[28rem] flex-col rounded-[20px] border bg-[color:var(--panel)] shadow-[var(--shadow)] transition ${
        isDropTarget
          ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/35"
          : "border-white/8"
      }`}
      onDragOver={(event) => {
        if (!canEdit || activeDragTaskId === null) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOverColumn(column.id);
      }}
      onDrop={(event) => {
        if (!canEdit || activeDragTaskId === null) {
          return;
        }
        event.preventDefault();
        onDropTask(column.id);
      }}
    >
      <header className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{column.label}</h3>
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-slate-300">
              {column.task_count}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{STATUS_META[column.id].hint}</p>
        </div>
        {canEdit ? (
          <button
            className="rounded-full border border-white/10 px-2.5 py-0.5 text-lg leading-none text-slate-300 transition hover:border-[color:var(--accent)] hover:text-white"
            onClick={() => onAdd(column.id)}
            type="button"
          >
            +
          </button>
        ) : null}
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              canDrag={canEdit}
              isDragging={activeDragTaskId === task.id}
              onClick={onEdit}
              onDragEnd={onDragEnd}
              onDragStart={onDragStart}
              task={task}
            />
          ))
        ) : (
          <div className="rounded-[18px] border border-dashed border-white/10 bg-white/4 px-3 py-4 text-sm text-slate-400">
            No tasks in this column yet.
          </div>
        )}
      </div>
    </section>
  );
}
