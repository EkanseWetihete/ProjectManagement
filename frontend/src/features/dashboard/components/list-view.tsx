"use client";

import { useMemo, useState } from "react";

import { PRIORITY_META, STATUS_META } from "@/features/dashboard/constants";
import type { TaskPriority, TaskStatus, TaskSummary } from "@/features/dashboard/types";
import { formatAssigneeNames, formatDateRange, isTaskOverdue, } from "@/features/dashboard/utils";

type ListViewProps = {
  canEdit: boolean;
  onEdit: (task: TaskSummary) => void;
  tasks: TaskSummary[];
};

type SortField = "assignees" | "end_date" | "priority" | "progress" | "status" | "title";
type SortDirection = "asc" | "desc";
type SortConfig = {
  direction: SortDirection;
  field: SortField;
};

const filterClassName =
  "rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white focus:border-[color:var(--accent)] focus:outline-none";

const priorityRank: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const sortableHeaderClassName =
  "inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-medium text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]";

function getAriaSort(field: SortField, sortConfig: SortConfig) {
  if (sortConfig.field !== field) {
    return "none" as const;
  }

  return sortConfig.direction === "asc" ? "ascending" : "descending";
}

function getSortIndicator(field: SortField, sortConfig: SortConfig) {
  if (sortConfig.field !== field) {
    return <span className="text-[10px] text-slate-500">↕</span>;
  }

  return sortConfig.direction === "asc" ? (
    <span className="text-[10px] text-white">↑</span>
  ) : (
    <span className="text-[10px] text-white">↓</span>
  );
}

export function ListView({ canEdit, onEdit, tasks }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ direction: "asc", field: "end_date" });

  const toggleSort = (field: SortField) => {
    setSortConfig((current) => {
      if (current.field === field) {
        return {
          direction: current.direction === "asc" ? "desc" : "asc",
          field,
        };
      }

      return { direction: "asc", field };
    });
  };

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...tasks]
      .filter((task) => {
        if (statusFilter !== "all" && task.status !== statusFilter) {
          return false;
        }

        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
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

        switch (sortConfig.field) {
          case "assignees":
            result = left.assignees .map((assignee) => assignee.name) .join(", ") .localeCompare(right.assignees.map((assignee) => assignee.name).join(", "));
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
          case "status":
            result = STATUS_META[left.status].label.localeCompare(STATUS_META[right.status].label);
            break;
          case "end_date":
          default:
            result = left.end_date.localeCompare(right.end_date);
            break;
        }

        return sortConfig.direction === "asc" ? result : -result;
      });
  }, [priorityFilter, searchTerm, sortConfig, statusFilter, tasks]);

  return (
    <section className="rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-4 border-b border-white/8 pb-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex gap-2">
          <h2 className="text-lg font-semibold text-white">Task List</h2>
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
            {filteredTasks.length} of {tasks.length} tasks
          </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">Full project table for quick scanning and review.</p>
        </div>
        <div className="flex flex-col gap-2 xl:items-end">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <input className={`${filterClassName} min-w-52`} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search tasks or owners" type="search" value={searchTerm} />
            <select className={filterClassName} onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "all")} value={statusFilter} >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
            <select className={filterClassName} onChange={(event) => setPriorityFilter(event.target.value as TaskPriority | "all")} value={priorityFilter} >
              <option value="all">All priorities</option>
              {Object.entries(PRIORITY_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th aria-sort={getAriaSort("title", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("title")} type="button">
                  <span>Task</span>
                  {getSortIndicator("title", sortConfig)}
                </button>
              </th>
              <th aria-sort={getAriaSort("assignees", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("assignees")} type="button">
                  <span>Owners</span>
                  {getSortIndicator("assignees", sortConfig)}
                </button>
              </th>
              <th aria-sort={getAriaSort("status", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("status")} type="button">
                  <span>Status</span>
                  {getSortIndicator("status", sortConfig)}
                </button>
              </th>
              <th aria-sort={getAriaSort("priority", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("priority")} type="button">
                  <span>Priority</span>
                  {getSortIndicator("priority", sortConfig)}
                </button>
              </th>
              <th aria-sort={getAriaSort("end_date", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("end_date")} type="button">
                  <span>Dates</span>
                  {getSortIndicator("end_date", sortConfig)}
                </button>
              </th>
              <th aria-sort={getAriaSort("progress", sortConfig)} className="px-3">
                <button className={sortableHeaderClassName} onClick={() => toggleSort("progress")} type="button">
                  <span>Progress</span>
                  {getSortIndicator("progress", sortConfig)}
                </button>
              </th>
              <th className="px-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="rounded-3xl bg-white/4 text-slate-100">
                <td className="rounded-l-2xl px-3 py-3">
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="mt-1 max-w-md text-xs text-slate-400">{task.description}</p>
                </td>
                <td className="px-3 py-3">{formatAssigneeNames(task.assignees)}</td>
                <td className="px-3 py-3">{STATUS_META[task.status].label}</td>
                <td className="px-3 py-3 capitalize">{PRIORITY_META[task.priority].label}</td>
                <td className={`px-3 py-3 text-xs ${ isTaskOverdue(task) ? "text-rose-300" : "text-slate-300" }`} >
                  {formatDateRange(task.start_date, task.end_date)}
                </td>
                <td className="px-3 py-3">{task.progress}%</td>
                <td className="rounded-r-2xl px-3 py-3">
                  {canEdit ? (
                    <button className="rounded-lg border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/10" onClick={() => onEdit(task)} type="button" >
                      Edit
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Read only</span>
                  )}
                </td>
              </tr>
            ))}
            {!filteredTasks.length ? (
              <tr>
                <td className="rounded-2xl bg-white/4 px-3 py-6 text-center text-sm text-slate-400" colSpan={7}>
                  No tasks match the current search or filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
