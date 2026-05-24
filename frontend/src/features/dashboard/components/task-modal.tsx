"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { STATUS_META } from "@/features/dashboard/constants";
import type {
  TaskObjectiveWrite,
  TaskStatus,
  TaskSummary,
  TaskWrite,
  TeamMember,
} from "@/features/dashboard/types";
import { buildTaskDraft } from "@/features/dashboard/utils";

type TaskModalProps = {
  busy: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onDelete: (taskId: number) => Promise<boolean>;
  onSave: (task: TaskWrite, taskId?: number) => Promise<boolean>;
  projectId: number;
  statusHint: TaskStatus;
  task: TaskSummary | null;
  tasks: TaskSummary[];
  team: TeamMember[];
};

type ObjectiveDraft = TaskObjectiveWrite & {
  local_id: string;
};

type TaskDraft = Omit<TaskWrite, "objectives"> & {
  objectives: ObjectiveDraft[];
};

type MemberSelectDropdownProps = {
  compact?: boolean;
  dropdownId: string;
  isOpen: boolean;
  onToggle: (memberId: number) => void;
  onToggleOpen: (dropdownId: string | null) => void;
  placeholder: string;
  selectedIds: number[];
  team: TeamMember[];
};

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[color:var(--accent)] focus:outline-none";

const compactInputClassName =
  "h-8 w-full rounded-lg border border-white/10 bg-white/6 px-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[color:var(--accent)] focus:outline-none";

function createObjectiveKey() {
  return `objective-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function toObjectiveDraft(objective: TaskObjectiveWrite): ObjectiveDraft {
  return {
    ...objective,
    local_id: createObjectiveKey(),
  };
}

function toggleId(values: number[], id: number) {
  return values.includes(id)
    ? values.filter((currentId) => currentId !== id)
    : [...values, id];
}

function getSelectedMemberText(selectedIds: number[], team: TeamMember[], placeholder: string) {
  if (!team.length) {
    return placeholder;
  }

  return `${selectedIds.length}/${team.length} selected`;
}

function MemberSelectDropdown({
  compact = false,
  dropdownId,
  isOpen,
  onToggle,
  onToggleOpen,
  placeholder,
  selectedIds,
  team,
}: MemberSelectDropdownProps) {
  const selectedText = getSelectedMemberText(selectedIds, team, placeholder);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    function updatePanelPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setPanelStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) {
        onToggleOpen(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, onToggleOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        className={`${compact ? compactInputClassName : inputClassName} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => onToggleOpen(isOpen ? null : dropdownId)}
        ref={triggerRef}
        type="button"
      >
        <span className="truncate text-sm text-white">{selectedText}</span>
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
            {selectedIds.length || 0}
          </span>
          <span className={`text-xs text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}>
            v
          </span>
        </span>
      </button>
      {isOpen && panelStyle
        ? createPortal(
            <div
              className="fixed z-[90] max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[color:var(--panel-strong)] p-1.5 shadow-[var(--shadow)]"
              ref={panelRef}
              style={{
                top: panelStyle.top,
                left: panelStyle.left,
                width: panelStyle.width,
              }}
            >
              {team.map((member) => {
                const selected = selectedIds.includes(member.id);

                return (
                  <label
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition ${
                      selected ? "bg-[color:var(--accent)]/15 text-white" : "text-slate-300 hover:bg-white/6"
                    }`}
                    key={member.id}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium leading-5">{member.name}</span>
                      <span className="block truncate text-[11px] leading-4 text-slate-400">{member.role}</span>
                    </span>
                    <input
                      checked={selected}
                      className="h-3.5 w-3.5 shrink-0 accent-[color:var(--accent)]"
                      onChange={() => onToggle(member.id)}
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function TaskModal({
  busy,
  mode,
  onClose,
  onDelete,
  onSave,
  projectId,
  statusHint,
  task,
  tasks,
  team,
}: TaskModalProps) {
  const nextSortOrder = useMemo(() => tasks.length * 10 + 10, [tasks.length]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(() => {
    const nextDraft = buildTaskDraft(task, projectId, nextSortOrder);
    if (!task) {
      nextDraft.status = statusHint;
    }

    return {
      ...nextDraft,
      objectives: nextDraft.objectives.map(toObjectiveDraft),
    };
  });

  const parentOptions = useMemo(
    () => tasks.filter((item) => item.id !== task?.id),
    [task?.id, tasks],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: TaskWrite = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      objectives: draft.objectives
        .map((objective) => {
          const { local_id, ...nextObjective } = objective;
          void local_id;

          return {
            ...nextObjective,
            title: nextObjective.title.trim(),
          };
        })
        .filter((objective) => objective.title.length > 0),
    };
    const succeeded = await onSave(payload, task?.id);
    if (succeeded) {
      onClose();
    }
  }

  async function handleDelete() {
    if (!task) {
      return;
    }
    const succeeded = await onDelete(task.id);
    if (succeeded) {
      onClose();
    }
  }

  function setField<Key extends keyof TaskDraft>(key: Key, value: TaskDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleTaskAssignee(memberId: number) {
    setDraft((current) => ({
      ...current,
      assignee_ids: toggleId(current.assignee_ids, memberId),
    }));
  }

  function addObjective() {
    setDraft((current) => ({
      ...current,
      objectives: [
        ...current.objectives,
        {
          local_id: createObjectiveKey(),
          title: "",
          started: false,
          assignee_ids: [],
        },
      ],
    }));
  }

  function removeObjective(localId: string) {
    setDraft((current) => ({
      ...current,
      objectives: current.objectives.filter((objective) => objective.local_id !== localId),
    }));
  }

  function setObjectiveField<Key extends keyof ObjectiveDraft>(
    localId: string,
    key: Key,
    value: ObjectiveDraft[Key],
  ) {
    setDraft((current) => ({
      ...current,
      objectives: current.objectives.map((objective) =>
        objective.local_id === localId ? { ...objective, [key]: value } : objective,
      ),
    }));
  }

  function toggleObjectiveAssignee(localId: string, memberId: number) {
    setDraft((current) => ({
      ...current,
      objectives: current.objectives.map((objective) =>
        objective.local_id === localId
          ? {
              ...objective,
              assignee_ids: toggleId(objective.assignee_ids, memberId),
            }
          : objective,
      ),
    }));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[50rem] overflow-y-auto rounded-[22px] border border-white/10 bg-[color:var(--panel-strong)] shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
              {mode === "edit" ? "Edit Task" : "Create Task"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {mode === "edit" ? task?.title : STATUS_META[statusHint].label}
            </h2>
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <form className="space-y-3 px-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.4fr)_220px]">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Task Name</span>
              <input
                className={inputClassName}
                onChange={(event) => setField("title", event.target.value)}
                required
                value={draft.title}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Priority</span>
              <select
                className={inputClassName}
                onChange={(event) =>
                  setField("priority", event.target.value as TaskWrite["priority"])
                }
                value={draft.priority}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-200">Description</span>
            <textarea
              className={`${inputClassName} min-h-20 resize-y leading-5`}
              onChange={(event) => setField("description", event.target.value)}
              required
              value={draft.description}
            />
          </label>

          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[160px_220px_minmax(0,1fr)_160px]">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Status</span>
              <select
                className={inputClassName}
                onChange={(event) => setField("status", event.target.value as TaskStatus)}
                value={draft.status}
              >
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Assigned Team</span>
              <MemberSelectDropdown
                dropdownId="task-assignees"
                isOpen={openDropdownId === "task-assignees"}
                onToggle={toggleTaskAssignee}
                onToggleOpen={setOpenDropdownId}
                placeholder="Select team"
                selectedIds={draft.assignee_ids}
                team={team}
              />
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Parent Task</span>
              <select
                className={inputClassName}
                onChange={(event) =>
                  setField(
                    "parent_task_id",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                value={draft.parent_task_id ?? ""}
              >
                <option value="">None</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Sort Order</span>
              <input
                className={inputClassName}
                min={0}
                onChange={(event) => setField("sort_order", Number(event.target.value))}
                type="number"
                value={draft.sort_order}
              />
            </label>
          </div>

          <section className="space-y-2.5 rounded-[18px] border border-white/8 bg-white/4 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200">Objectives</h3>
                <p className="mt-0.5 text-xs leading-4 text-slate-400">
                  Keep them short, assign people from the dropdown, and toggle progress inline.
                </p>
              </div>
              <button
                className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:text-white"
                onClick={addObjective}
                type="button"
              >
                Add objective
              </button>
            </div>

            <div className="overflow-x-auto">
              {draft.objectives.length ? (
                <table className="min-w-[38rem] w-full border-separate border-spacing-y-1 text-left">
                  <thead>
                    <tr className="text-[10px] font-medium text-slate-500">
                      <th className="px-2 pb-0.5 font-medium">Objective</th>
                      <th className="px-2 pb-0.5 font-medium">Assigned</th>
                      <th className="px-2 pb-0.5 font-medium">Status</th>
                      <th className="px-2 pb-0.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.objectives.map((objective, index) => (
                      <tr key={objective.local_id}>
                        <td className="rounded-l-[12px] border-y border-l border-white/10 bg-slate-950/25 p-1 align-middle">
                          <input
                            className={compactInputClassName}
                            onChange={(event) =>
                              setObjectiveField(objective.local_id, "title", event.target.value)
                            }
                            placeholder="Objective name"
                            value={objective.title}
                          />
                        </td>
                        <td className="border-y border-white/10 bg-slate-950/25 p-1 align-middle">
                          <MemberSelectDropdown
                            compact
                            dropdownId={`objective-assignees-${objective.local_id}`}
                            isOpen={openDropdownId === `objective-assignees-${objective.local_id}`}
                            onToggle={(memberId) => toggleObjectiveAssignee(objective.local_id, memberId)}
                            onToggleOpen={setOpenDropdownId}
                            placeholder="Select people"
                            selectedIds={objective.assignee_ids}
                            team={team}
                          />
                        </td>
                        <td className="border-y border-white/10 bg-slate-950/25 p-1 align-middle">
                          <select
                            className={compactInputClassName}
                            onChange={(event) =>
                              setObjectiveField(
                                objective.local_id,
                                "started",
                                event.target.value === "started",
                              )
                            }
                            value={objective.started ? "started" : "not_started"}
                          >
                            <option value="not_started">Not started</option>
                            <option value="started">Started</option>
                          </select>
                        </td>
                        <td className="rounded-r-[12px] border-y border-r border-white/10 bg-slate-950/25 p-1 align-middle">
                          <div className="flex justify-end">
                            <button
                              className="flex h-8 w-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/12 text-rose-200 transition hover:bg-rose-500/20 hover:text-white"
                              onClick={() => removeObjective(objective.local_id)}
                              type="button"
                              aria-label={`Remove objective ${index + 1}`}
                              title="Remove objective"
                            >
                              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <path
                                  d="M9 3.75h6m-7.5 3h9m-7.5 3.25v6.5m3-6.5v6.5m3-6.5v6.5M6.75 6.75l.6 11.096a1.5 1.5 0 0 0 1.498 1.404h6.304a1.5 1.5 0 0 0 1.498-1.404l.6-11.096"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.5"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-[12px] border border-dashed border-white/10 px-3 py-2.5 text-sm text-slate-400">
                  No objectives yet.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-2.5 md:grid-cols-[1fr_1fr_180px]">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Start Date</span>
              <input
                className={inputClassName}
                onChange={(event) => setField("start_date", event.target.value)}
                type="date"
                value={draft.start_date}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">End Date</span>
              <input
                className={inputClassName}
                onChange={(event) => setField("end_date", event.target.value)}
                type="date"
                value={draft.end_date}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-200">Progress</span>
              <input
                className="w-full accent-[color:var(--accent)]"
                max={100}
                min={0}
                onChange={(event) => setField("progress", Number(event.target.value))}
                type="range"
                value={draft.progress}
              />
              <p className="text-xs leading-4 text-slate-400">{draft.progress}% complete</p>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-white/8 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "edit" && task ? (
              <button
                className="rounded-xl bg-[color:var(--danger)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                disabled={busy}
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            ) : (
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Project {projectId}
              </span>
            )}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
                disabled={busy}
                type="submit"
              >
                {busy ? "Saving..." : "Save Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}