import type { ProjectSummary } from "@/features/dashboard/types";

type TopBarProps = {
  activeProjectId: number;
  busy: boolean;
  canEdit: boolean;
  onOpenNewTask: () => void;
  onProjectChange: (projectId: number) => void;
  onRefresh: () => void;
  onToggleAdminPanel: () => void;
  projectCodeName: string;
  projects: ProjectSummary[];
  username: string | null;
};

const buttonClassName =
  "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10";

export function TopBar({
  activeProjectId,
  busy,
  canEdit,
  onOpenNewTask,
  onProjectChange,
  onRefresh,
  onToggleAdminPanel,
  projectCodeName,
  projects,
  username,
}: TopBarProps) {
  return (
    <header className="rounded-[24px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Project Manager</p>
            <h1 className="mt-1.5 text-xl font-semibold text-white">Project Management</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="min-w-52 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white focus:border-[color:var(--accent)] focus:outline-none"
              onChange={(event) => onProjectChange(Number(event.target.value))}
              value={activeProjectId}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code_name}
                </option>
              ))}
            </select>
            <span className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-300">
              {projectCodeName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button className={buttonClassName} onClick={onRefresh} type="button">
            Refresh
          </button>
          {canEdit ? (
            <button className={buttonClassName} onClick={onOpenNewTask} type="button">
              New Task
            </button>
          ) : null}
          <button
            className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            onClick={onToggleAdminPanel}
            type="button"
          >
            {canEdit ? `Admin: ${username}` : "Admin Login"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-sm text-slate-400">
        <p>Compact multi-view workspace for planning, review, and delivery.</p>
        <span>{busy ? "Syncing..." : "Live"}</span>
      </div>
    </header>
  );
}
