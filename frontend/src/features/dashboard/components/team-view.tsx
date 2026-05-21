"use client";

import { useState } from "react";

import type { TaskSummary, TeamMember, TeamMemberWrite } from "@/features/dashboard/types";
import { TeamMemberModal } from "@/features/dashboard/components/team-member-modal";
import { formatDate } from "@/features/dashboard/utils";

type TeamViewProps = {
  busy: boolean;
  canEdit: boolean;
  onSaveMember: (member: TeamMemberWrite, memberId?: number) => Promise<boolean>;
  onRemoveMember: (memberId: number) => Promise<boolean>;
  team: TeamMember[];
  tasks: TaskSummary[];
};

export function TeamView({
  busy,
  canEdit,
  onSaveMember,
  onRemoveMember,
  team,
  tasks,
}: TeamViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  return (
    <section className="rounded-[22px] border border-white/8 bg-[color:var(--panel)] p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Team Workload</h2>
          <p className="mt-1 text-sm text-slate-300">Focused snapshot of ownership and workload balance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{team.length} members</span>
          {canEdit ? (
            <button
              className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
            >
              Add member
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {team.map((member) => {
          const assignedTasks = tasks.filter((task) =>
            task.assignees.some((assignee) => assignee.id === member.id),
          );

          return (
            <article
              key={member.id}
              className="rounded-[20px] border border-white/8 bg-white/4 p-3.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-slate-950"
                  style={{ backgroundColor: member.accent_color }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </div>
                {canEdit ? (
                  <button
                    aria-label={`Edit ${member.name}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busy}
                    onClick={() => setEditingMember(member)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 -5 25 27">
                      <path
                        d="M10.325 4.317a1 1 0 0 1 1.35-.936l.807.36a1 1 0 0 0 .814 0l.807-.36a1 1 0 0 1 1.35.936v.884a1 1 0 0 0 .49.866l.725.419a1 1 0 0 1 .366 1.366l-.402.696a1 1 0 0 0 0 1l.402.696a1 1 0 0 1-.366 1.366l-.726.419a1 1 0 0 0-.489.866v.884a1 1 0 0 1-1.35.936l-.807-.36a1 1 0 0 0-.814 0l-.807.36a1 1 0 0 1-1.35-.936v-.884a1 1 0 0 0-.49-.866l-.725-.419a1 1 0 0 1-.366-1.366l.402-.696a1 1 0 0 0 0-1l-.402-.696a1 1 0 0 1 .366-1.366l.725-.419a1 1 0 0 0 .49-.866v-.884Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                      <path d="M9.75 12a2.25 2.25 0 1 0 4.5 0a2.25 2.25 0 0 0-4.5 0Z" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-300">{member.task_count} assigned tasks</p>
              <div className="mt-3 space-y-2.5">
                {assignedTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-xl bg-white/6 px-3 py-2.5 text-sm text-slate-200">
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-400">Due {formatDate(task.end_date)}</p>
                  </div>
                ))}
                {!assignedTasks.length ? (
                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-sm text-slate-400">
                    No assigned work in this project.
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Removing a member keeps existing tasks and clears their task and objective assignments automatically.
      </p>
      {canEdit && isCreateModalOpen ? (
        <TeamMemberModal
          busy={busy}
          key="create-member"
          member={null}
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onDelete={onRemoveMember}
          onSave={onSaveMember}
        />
      ) : null}
      {canEdit && editingMember ? (
        <TeamMemberModal
          busy={busy}
          key={`edit-member-${editingMember.id}`}
          member={editingMember}
          mode="edit"
          onClose={() => setEditingMember(null)}
          onDelete={onRemoveMember}
          onSave={onSaveMember}
        />
      ) : null}
    </section>
  );
}
