"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { PRIORITY_META, STATUS_META } from "@/features/dashboard/constants";
import { AdminPanel } from "@/features/dashboard/components/admin-panel";
import { BoardColumn } from "@/features/dashboard/components/board-column";
import { GanttView } from "@/features/dashboard/components/gantt-view";
import { ListView } from "@/features/dashboard/components/list-view";
import { TaskModal } from "./task-modal";
import { TeamView } from "@/features/dashboard/components/team-view";
import { TopBar } from "@/features/dashboard/components/top-bar";
import { ViewTabs } from "@/features/dashboard/components/view-tabs";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import type { TaskPriority, TaskStatus, TaskSummary, ViewMode } from "@/features/dashboard/types";
import { groupTasksByStatus, toTaskWrite } from "@/features/dashboard/utils";

type KanbanSortField = "assignees" | "end_date" | "priority" | "progress" | "title";
type KanbanSortDirection = "asc" | "desc";
type KanbanSortConfig = {
  direction: KanbanSortDirection;
  field: KanbanSortField;
};

const filterClassName =
  "w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white focus:border-[color:var(--accent)] focus:outline-none";

const priorityRank: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function DashboardSkeleton() {
  return (
    <main className="min-h-screen p-3 md:p-4">
      <div className="mx-auto max-w-[1520px] animate-pulse space-y-3">
        <div className="h-24 rounded-[32px] bg-white/6" />
        <div className="h-14 rounded-[28px] bg-white/6" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[34rem] rounded-[28px] bg-white/6" />
          ))}
        </div>
      </div>
    </main>
  );
}

export function DashboardScreen() {
  const { actions, dashboard, error, loading, refreshing, saving, session } = useDashboard();
  const [activeView, setActiveView] = useState<ViewMode>("kanban");
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);
  const [creationStatus, setCreationStatus] = useState<TaskStatus>("todo");
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [kanbanSearchTerm, setKanbanSearchTerm] = useState("");
  const [kanbanStatusFilter, setKanbanStatusFilter] = useState<TaskStatus | "all">("all");
  const [kanbanPriorityFilter, setKanbanPriorityFilter] = useState<TaskPriority | "all">("all");
  const [kanbanSortConfig, setKanbanSortConfig] = useState<KanbanSortConfig>({
    direction: "asc",
    field: "end_date",
  });
  const [showKanbanControls, setShowKanbanControls] = useState(false);

  const deferredTasks = useDeferredValue(dashboard?.tasks ?? []);
  const groupedTasks = useMemo(() => {
    const normalizedSearch = kanbanSearchTerm.trim().toLowerCase();

    const visibleTasks = [...deferredTasks]
      .filter((task) => {
        if (kanbanStatusFilter !== "all" && task.status !== kanbanStatusFilter) {
          return false;
        }

        if (kanbanPriorityFilter !== "all" && task.priority !== kanbanPriorityFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const ownerNames = task.assignees.map((assignee) => assignee.name).join(" ").toLowerCase();
        const haystack = `${task.title} ${task.description} ${ownerNames}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      .sort((left, right) => {
        let result = 0;

        switch (kanbanSortConfig.field) {
          case "assignees":
            result = left.assignees
              .map((assignee) => assignee.name)
              .join(", ")
              .localeCompare(right.assignees.map((assignee) => assignee.name).join(", "));
            break;
          case "title":
            result = left.title.localeCompare(right.title);
            break;
          case "priority":
            result = priorityRank[left.priority] - priorityRank[right.priority];
            break;
          case "progress":
            result = left.progress - right.progress;
            break;
          case "end_date":
          default:
            result = left.end_date.localeCompare(right.end_date);
            break;
        }

        return kanbanSortConfig.direction === "asc" ? result : -result;
      });

    return groupTasksByStatus(visibleTasks);
  }, [deferredTasks, kanbanPriorityFilter, kanbanSearchTerm, kanbanSortConfig, kanbanStatusFilter]);

  useEffect(() => {
    const activeProject = dashboard?.project;
    if (!activeProject) {
      return;
    }

    setProjectName(activeProject.name);
    setProjectDescription(activeProject.description);
    setShowProjectOptions(false);
  }, [dashboard?.project.description, dashboard?.project.id, dashboard?.project.name]);

  useEffect(() => {
    if (activeView !== "kanban") {
      setShowKanbanControls(false);
    }
  }, [activeView]);

  if (!dashboard && loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-[24px] border border-white/10 bg-[color:var(--panel)] p-6 text-center shadow-[var(--shadow)]">
          <p className="text-sm uppercase tracking-[0.34em] text-slate-400">Backend</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Unable to load board data</h1>
          <p className="mt-3 text-sm text-slate-300">{error ?? "Start the FastAPI server and refresh."}</p>
          <button
            className="mt-5 rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            onClick={() => void actions.refresh()}
            type="button"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const canEdit = session.authenticated;
  const modalOpen = isCreating || Boolean(editingTask);
  const trimmedProjectName = projectName.trim();
  const trimmedProjectDescription = projectDescription.trim();
  const projectChanged =
    trimmedProjectName !== dashboard.project.name ||
    trimmedProjectDescription !== dashboard.project.description;

  function openCreate(status: TaskStatus) {
    setCreationStatus(status);
    setEditingTask(null);
    setIsCreating(true);
  }

  function openEdit(task: TaskSummary) {
    if (!canEdit) {
      return;
    }

    setIsCreating(false);
    setEditingTask(task);
  }

  function closeModal() {
    setEditingTask(null);
    setIsCreating(false);
  }

  function cancelProjectEdit() {
    const activeProject = dashboard?.project;
    if (!activeProject) {
      return;
    }

    setProjectName(activeProject.name);
    setProjectDescription(activeProject.description);
  }

  function resetKanbanControls() {
    setKanbanSearchTerm("");
    setKanbanStatusFilter("all");
    setKanbanPriorityFilter("all");
    setKanbanSortConfig({ direction: "asc", field: "end_date" });
  }

  async function handleProjectSave() {
    const activeProject = dashboard?.project;
    if (!activeProject) {
      return;
    }

    const succeeded = await actions.saveProject(activeProject.id, {
      name: trimmedProjectName,
      description: trimmedProjectDescription,
    });

    if (succeeded) {
      setShowProjectOptions(false);
    }
  }

  function handleDragStart(task: TaskSummary) {
    if (!canEdit || saving) {
      return;
    }

    setDragTaskId(task.id);
    setDropTargetStatus(task.status);
  }

  function handleDragEnd() {
    setDragTaskId(null);
    setDropTargetStatus(null);
  }

  async function moveTaskToStatus(nextStatus: TaskStatus) {
    if (!canEdit || !dragTaskId || !dashboard) {
      return;
    }

    const task = dashboard.tasks.find((item) => item.id === dragTaskId);
    if (!task) {
      handleDragEnd();
      return;
    }

    const targetTasks = dashboard.tasks.filter(
      (item) => item.status === nextStatus && item.id !== task.id,
    );
    const nextSortOrder = targetTasks.length
      ? Math.max(...targetTasks.map((item) => item.sort_order)) + 10
      : 10;

    const succeeded = await actions.saveTask(
      {
        ...toTaskWrite(task),
        status: nextStatus,
        sort_order: nextSortOrder,
      },
      task.id,
    );

    if (succeeded) {
      handleDragEnd();
    }
  }

  return (
    <main className="min-h-screen p-3 md:p-4">
      <div className="mx-auto max-w-[1520px] space-y-3">
        <div className="relative">
          <TopBar
            busy={loading || refreshing || saving}
            canEdit={canEdit}
            onRefresh={() => void actions.forceRefresh(dashboard.project.id)}
            onToggleProjectOptions={() => setShowProjectOptions((current) => !current)}
            onToggleAdminPanel={() => setShowAdminPanel((current) => !current)}
            project={dashboard.project}
            projectOptionsOpen={showProjectOptions}
            username={session.user?.username ?? null}
          />
          {showProjectOptions ? (
            <section className="absolute inset-x-0 top-full z-20 mt-3 rounded-[22px] border border-white/8 bg-[color:var(--panel-strong)] p-4 shadow-[var(--shadow)] backdrop-blur-xl">
              <div className="grid gap-4 xl:grid-cols-[minmax(16rem,20rem)_1fr]">
                <div className="space-y-2.5">
                  <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Project Switcher</p>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-white focus:border-[color:var(--accent)] focus:outline-none"
                    onChange={(event) => void actions.selectProject(Number(event.target.value))}
                    value={dashboard.project.id}
                  >
                    {dashboard.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-slate-400">Code: {dashboard.project.code_name}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Project Details</p>
                    {canEdit ? (
                      <div className="mt-3 space-y-2.5">
                        <input
                          className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-lg font-semibold text-white placeholder:text-slate-500 focus:border-[color:var(--accent)] focus:outline-none"
                          maxLength={120}
                          onChange={(event) => setProjectName(event.target.value)}
                          placeholder="Project name"
                          type="text"
                          value={projectName}
                        />
                        <textarea
                          className="min-h-24 w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[color:var(--accent)] focus:outline-none"
                          maxLength={600}
                          onChange={(event) => setProjectDescription(event.target.value)}
                          placeholder="Project description"
                          value={projectDescription}
                        />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-300">{dashboard.project.description}</p>
                    )}
                  </div>

                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving || !trimmedProjectName || !projectChanged}
                        onClick={() => void handleProjectSave()}
                        type="button"
                      >
                        {saving ? "Saving..." : "Save project"}
                      </button>
                      <button
                        className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
                        disabled={saving}
                        onClick={cancelProjectEdit}
                        type="button"
                      >
                        Reset
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
          {showAdminPanel ? (
            <AdminPanel
              busy={saving}
              onClose={() => setShowAdminPanel(false)}
              onLogout={actions.signOut}
              onSubmit={actions.signIn}
              session={session}
            />
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 px-3 py-2.5 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <ViewTabs
          activeView={activeView}
          kanbanControls={
            <div className="w-full max-w-sm space-y-3 rounded-[20px] border border-white/10 bg-[color:var(--panel-strong)] p-3 shadow-[var(--shadow)] backdrop-blur-xl">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Board controls</p>
              </div>
              <input
                className={filterClassName}
                onChange={(event) => setKanbanSearchTerm(event.target.value)}
                placeholder="Search tasks or owners"
                type="search"
                value={kanbanSearchTerm}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className={filterClassName}
                  onChange={(event) => setKanbanStatusFilter(event.target.value as TaskStatus | "all")}
                  value={kanbanStatusFilter}
                >
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
                <select
                  className={filterClassName}
                  onChange={(event) => setKanbanPriorityFilter(event.target.value as TaskPriority | "all")}
                  value={kanbanPriorityFilter}
                >
                  <option value="all">All priorities</option>
                  {Object.entries(PRIORITY_META).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <select
                  className={filterClassName}
                  onChange={(event) =>
                    setKanbanSortConfig((current) => ({
                      ...current,
                      field: event.target.value as KanbanSortField,
                    }))
                  }
                  value={kanbanSortConfig.field}
                >
                  <option value="end_date">Sort by due date</option>
                  <option value="title">Sort by title</option>
                  <option value="priority">Sort by priority</option>
                  <option value="progress">Sort by progress</option>
                  <option value="assignees">Sort by owners</option>
                </select>
                <select
                  className={filterClassName}
                  onChange={(event) =>
                    setKanbanSortConfig((current) => ({
                      ...current,
                      direction: event.target.value as KanbanSortDirection,
                    }))
                  }
                  value={kanbanSortConfig.direction}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
                  onClick={resetKanbanControls}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>
          }
          kanbanControlsOpen={showKanbanControls}
          onChange={setActiveView}
          onToggleKanbanControls={() => setShowKanbanControls((current) => !current)}
          stats={dashboard.stats}
        />

        {activeView === "kanban" ? (
          <div className="grid gap-3 xl:grid-cols-4">
            {dashboard.columns.map((column) => (
              <BoardColumn
                activeDragTaskId={dragTaskId}
                key={column.id}
                canEdit={canEdit}
                column={column}
                isDropTarget={dropTargetStatus === column.id}
                onAdd={openCreate}
                onDragEnd={handleDragEnd}
                onDragOverColumn={setDropTargetStatus}
                onDragStart={handleDragStart}
                onDropTask={(status) => void moveTaskToStatus(status)}
                onEdit={openEdit}
                tasks={groupedTasks[column.id]}
              />
            ))}
          </div>
        ) : null}

        {activeView === "gantt" ? <GanttView tasks={dashboard.tasks} /> : null}
        {activeView === "list" ? (
          <ListView canEdit={canEdit} onEdit={openEdit} tasks={dashboard.tasks} />
        ) : null}
        {activeView === "team" ? (
          <TeamView
            busy={saving}
            canEdit={canEdit}
            onSaveMember={actions.saveMember}
            onRemoveMember={actions.removeMember}
            team={dashboard.team}
            tasks={dashboard.tasks}
          />
        ) : null}

        {modalOpen ? (
          <TaskModal
            key={editingTask?.id ?? `create-${creationStatus}-${dashboard.project.id}`}
            busy={saving}
            mode={editingTask ? "edit" : "create"}
            onClose={closeModal}
            onDelete={(taskId: number) => actions.removeTask(taskId, dashboard.project.id)}
            onSave={actions.saveTask}
            projectId={dashboard.project.id}
            statusHint={creationStatus}
            task={editingTask}
            tasks={dashboard.tasks}
            team={dashboard.team}
          />
        ) : null}
      </div>
    </main>
  );
}
