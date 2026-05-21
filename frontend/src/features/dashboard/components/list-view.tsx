import type { TaskSummary } from "@/features/dashboard/types";
import {
  formatAssigneeNames,
  formatDateRange,
  isTaskOverdue,
} from "@/features/dashboard/utils";

type ListViewProps = {
  tasks: TaskSummary[];
};

export function ListView({ tasks }: ListViewProps) {
  return (
    <section className="rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Task List</h2>
          <p className="mt-1 text-sm text-slate-300">Full project table for quick scanning and review.</p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{tasks.length} tasks</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="px-3">Task</th>
              <th className="px-3">Owners</th>
              <th className="px-3">Status</th>
              <th className="px-3">Priority</th>
              <th className="px-3">Dates</th>
              <th className="px-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="rounded-3xl bg-white/4 text-slate-100">
                <td className="rounded-l-2xl px-3 py-3">
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="mt-1 max-w-md text-xs text-slate-400">{task.description}</p>
                </td>
                <td className="px-3 py-3">{formatAssigneeNames(task.assignees)}</td>
                <td className="px-3 py-3">{task.status.replace("_", " ")}</td>
                <td className="px-3 py-3 capitalize">{task.priority}</td>
                <td
                  className={`px-3 py-3 text-xs ${
                    isTaskOverdue(task) ? "text-rose-300" : "text-slate-300"
                  }`}
                >
                  {formatDateRange(task.start_date, task.end_date)}
                </td>
                <td className="rounded-r-2xl px-3 py-3">{task.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
