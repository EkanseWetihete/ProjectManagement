"use client";

import { useState } from "react";

import type { TeamMember, TeamMemberWrite } from "@/features/dashboard/types";

type TeamMemberModalProps = {
  busy: boolean;
  member: TeamMember | null;
  mode: "create" | "edit";
  onClose: () => void;
  onDelete: (memberId: number) => Promise<boolean>;
  onSave: (member: TeamMemberWrite, memberId?: number) => Promise<boolean>;
};

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[color:var(--accent)] focus:outline-none";

const COLOR_OPTIONS = ["#7c8dff", "#42c9a1", "#ffb454", "#ff6f91", "#78dce8", "#ffd866"];

export function TeamMemberModal({
  busy,
  member,
  mode,
  onClose,
  onDelete,
  onSave,
}: TeamMemberModalProps) {
  const [draft, setDraft] = useState<TeamMemberWrite>({
    name: member?.name ?? "",
    role: member?.role ?? "",
    accent_color: member?.accent_color ?? COLOR_OPTIONS[0],
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSave(
      {
        name: draft.name.trim(),
        role: draft.role.trim(),
        accent_color: draft.accent_color,
      },
      member?.id,
    );

    if (succeeded) {
      onClose();
    }
  }

  async function handleDelete() {
    if (!member) {
      return;
    }

    const succeeded = await onDelete(member.id);
    if (succeeded) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[color:var(--panel-strong)] shadow-[var(--shadow)]">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
              {mode === "edit" ? "Edit Member" : "Add Member"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {mode === "edit" ? member?.name : "New team member"}
            </h2>
          </div>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Name</span>
              <input
                className={inputClassName}
                maxLength={80}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Team member name"
                required
                value={draft.name}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Role</span>
              <input
                className={inputClassName}
                maxLength={80}
                onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
                placeholder="Designer, Engineer, Producer..."
                required
                value={draft.role}
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-200">Accent Color</span>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  aria-label={`Select ${color}`}
                  className={`h-12 w-12 rounded-2xl border transition ${
                    draft.accent_color === color ? "border-white" : "border-white/10"
                  }`}
                  onClick={() => setDraft((current) => ({ ...current, accent_color: color }))}
                  style={{ backgroundColor: color }}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            {mode === "edit" && member ? (
              <button
                className="rounded-2xl bg-[color:var(--danger)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                disabled={busy}
                onClick={handleDelete}
                type="button"
              >
                Remove member
              </button>
            ) : (
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Team settings
              </span>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy || !draft.name.trim() || !draft.role.trim()}
                type="submit"
              >
                {busy ? "Saving..." : mode === "edit" ? "Save member" : "Add member"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}