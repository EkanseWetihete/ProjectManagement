import type { TaskSummary } from "@/features/dashboard/types";
import {
  daysBetween,
  formatAssigneeNames,
  formatDate,
  isTaskOverdue,
} from "@/features/dashboard/utils";

type GanttViewProps = {
  tasks: TaskSummary[];
};

export function GanttView({ tasks }: GanttViewProps) {
  const sortedTasks = [...tasks].sort((left, right) =>
    left.start_date.localeCompare(right.start_date),
  );

  if (!sortedTasks.length) {
    return null;
  }

  const timelineStart = sortedTasks[0].start_date;
  const timelineEnd = [...sortedTasks]
    .sort((left, right) => right.end_date.localeCompare(left.end_date))[0]
    .end_date;
  const totalDays = daysBetween(timelineStart, timelineEnd);

  return (
    <section className="rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Gantt Overview</h2>
          <p className="mt-1 text-sm text-slate-300">Compact timeline for deadlines and overlaps.</p>
        </div>
        <p className="text-sm text-slate-400">
          {formatDate(timelineStart)} - {formatDate(timelineEnd)}
        </p>
      </div>
      <div className="mt-4 space-y-2.5">
        {sortedTasks.map((task) => {
          const overdue = isTaskOverdue(task);
          const offset = Math.max(0, daysBetween(timelineStart, task.start_date) - 1);
          const width = daysBetween(task.start_date, task.end_date);
          const left = (offset / totalDays) * 100;
          const size = (width / totalDays) * 100;

          return (
            <div
              key={task.id}
              className="grid gap-3 rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 lg:grid-cols-[220px,1fr]"
            >
              <div>
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-xs text-slate-400">{formatAssigneeNames(task.assignees)}</p>
              </div>
              <div className="relative h-9 rounded-full bg-white/6">
                <div
                  className="absolute top-1/2 h-5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#6f79ff,#4cd4aa)] px-3 text-xs font-semibold text-white shadow-lg"
                  style={{ left: `${left}%`, width: `${Math.max(size, 8)}%` }}
                >
                  <div className="flex h-full items-center justify-between gap-2 overflow-hidden whitespace-nowrap">
                    <span>{task.progress}%</span>
                    <span className={overdue ? "text-rose-200" : "text-white"}>
                      {formatDate(task.end_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
