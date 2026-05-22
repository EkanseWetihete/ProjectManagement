import { VIEW_OPTIONS } from "@/features/dashboard/constants";
import type { DashboardStats, ViewMode } from "@/features/dashboard/types";

type ViewTabsProps = {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
  stats: DashboardStats;
};

const statItems = [
  { key: "total_tasks", label: "Tasks" },
  { key: "completed_tasks", label: "Done" },
  { key: "overdue_tasks", label: "Overdue" },
  { key: "active_members", label: "Active Team" },
] as const;

export function ViewTabs({ activeView, onChange, stats }: ViewTabsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-2 shadow-[var(--shadow)] xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((view) => {
          const isActive = view.id === activeView;
          return (
            <button
              key={view.id}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-[color:var(--accent)] text-white shadow-lg"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => onChange(view.id)}
              type="button"
            >
              {view.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        {statItems.map((item) => (
          <div
            key={item.key}
            className="flex h-10 items-center rounded-xl border border-white/8 bg-white/5 px-3 text-sm text-slate-200"
          >
            <span className="whitespace-nowrap">{item.label}: {stats[item.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
