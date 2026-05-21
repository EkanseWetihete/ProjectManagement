import type { DashboardStats } from "@/features/dashboard/types";

type StatsStripProps = {
  stats: DashboardStats;
};

const statItems = [
  { key: "total_tasks", label: "Tasks" },
  { key: "completed_tasks", label: "Done" },
  { key: "overdue_tasks", label: "Overdue" },
  { key: "active_members", label: "Active Team" },
] as const;

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => (
        <div
          key={item.key}
          className="min-w-[7rem] rounded-[20px] border border-white/8 bg-white/5 px-3 py-3"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
          <p className="mt-1.5 text-xl font-semibold text-white">{stats[item.key]}</p>
        </div>
      ))}
    </div>
  );
}
