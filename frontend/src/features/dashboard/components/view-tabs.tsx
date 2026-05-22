import type { ReactNode } from "react";

import { VIEW_OPTIONS } from "@/features/dashboard/constants";
import type { DashboardStats, ViewMode } from "@/features/dashboard/types";

type ViewTabsProps = {
  activeView: ViewMode;
  kanbanControls?: ReactNode;
  kanbanControlsOpen?: boolean;
  onChange: (view: ViewMode) => void;
  onToggleKanbanControls?: () => void;
  stats: DashboardStats;
};

const statItems = [
  { key: "total_tasks", label: "Tasks" },
  { key: "completed_tasks", label: "Done" },
  { key: "overdue_tasks", label: "Overdue" },
  { key: "active_members", label: "Active Team" },
] as const;

export function ViewTabs({
  activeView,
  kanbanControls,
  kanbanControlsOpen = false,
  onChange,
  onToggleKanbanControls,
  stats,
}: ViewTabsProps) {
  return (
    <div className="relative rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-2 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
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
            <div key={item.key} className="flex items-center gap-2">
              <div className="flex h-10 items-center rounded-xl border border-white/8 bg-white/5 px-3 text-sm text-slate-200">
                <span className="whitespace-nowrap">{item.label}: {stats[item.key]}</span>
              </div>
              {item.key === "active_members" && activeView === "kanban" && onToggleKanbanControls ? (
                <button
                  aria-expanded={kanbanControlsOpen}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                    kanbanControlsOpen
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-white"
                      : "border-white/8 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={onToggleKanbanControls}
                  type="button"
                >
                  <span>Filters</span>
                  <span aria-hidden="true" className="text-xs">
                    {kanbanControlsOpen ? "▲" : "▼"}
                  </span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {activeView === "kanban" && kanbanControlsOpen && kanbanControls ? (
        <div className="absolute right-2 top-[calc(100%+0.5rem)] z-30 flex w-[min(24rem,calc(100vw-2rem))] justify-end">
          {kanbanControls}
        </div>
      ) : null}
    </div>
  );
}
