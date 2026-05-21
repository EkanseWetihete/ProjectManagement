import { VIEW_OPTIONS } from "@/features/dashboard/constants";
import type { ViewMode } from "@/features/dashboard/types";

type ViewTabsProps = {
  activeView: ViewMode;
  onChange: (view: ViewMode) => void;
};

export function ViewTabs({ activeView, onChange }: ViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-2 shadow-[var(--shadow)]">
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
  );
}
