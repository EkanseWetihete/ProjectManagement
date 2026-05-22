import type { ProjectSummary } from "@/features/dashboard/types";

type TopBarProps = {
  busy: boolean;
  canEdit: boolean;
  onToggleProjectOptions: () => void;
  onToggleAdminPanel: () => void;
  project: ProjectSummary;
  projectOptionsOpen: boolean;
  username: string | null;
};

const buttonClassName =
  "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10";

export function TopBar({
  busy,
  canEdit,
  onToggleProjectOptions,
  onToggleAdminPanel,
  project,
  projectOptionsOpen,
  username,
}: TopBarProps) {
  return (
    <header className="rounded-[24px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Project Management</p>
          <div className="mt-1.5 flex min-w-0 items-center gap-3">
            <h1 className="truncate text-xl font-semibold text-white">{project.name}</h1>
            <span className="rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-300">
              {project.code_name}
            </span>
          </div>
          <p className="mt-2 truncate text-sm text-slate-400">
            {project.description || "Project details are managed from the options menu."}
          </p>
        </div>

        <div className="flex min-h-full flex-col items-end justify-between gap-3 xl:self-stretch">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button aria-expanded={projectOptionsOpen} aria-label="Project options" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white" onClick={onToggleProjectOptions} type="button" >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </button>
            <button className={`${buttonClassName} bg-[color:var(--accent)] font-semibold text-white hover:bg-[color:var(--accent-strong)]`} onClick={onToggleAdminPanel} type="button" >
              {canEdit ? `Admin: ${username}` : "Admin Login"}
            </button>
          </div>
          <span className={`mr-1 text-sm font-medium ${busy ? "text-[color:var(--warning)]" : "text-[color:var(--danger)]"}`} >
            {busy ? "Syncing..." : "Live"}
          </span>
        </div>
      </div>
    </header>
  );
}
