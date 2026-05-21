"use client";

import { useState } from "react";

import type { LoginPayload, SessionResponse } from "@/features/dashboard/types";

type AdminPanelProps = {
  busy: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onSubmit: (payload: LoginPayload) => Promise<boolean>;
  session: SessionResponse;
};

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-[color:var(--accent)] focus:outline-none";

export function AdminPanel({
  busy,
  onClose,
  onLogout,
  onSubmit,
  session,
}: AdminPanelProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onSubmit({ username, password });
    if (succeeded) {
      setPassword("");
      onClose();
    }
  }

  async function handleLogout() {
    await onLogout();
    onClose();
  }

  return (
    <div className="absolute right-0 top-[calc(100%+14px)] z-30 w-full max-w-sm rounded-[28px] border border-white/10 bg-[color:var(--panel-strong)] p-5 shadow-[var(--shadow)] backdrop-blur">
      {session.authenticated && session.user ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Admin Session
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {session.user.username}
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Editing is enabled for project and task changes.
              </p>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
          <button
            className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/16"
            disabled={busy}
            onClick={handleLogout}
            type="button"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Administrator Login
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Enable editing</h3>
              <p className="mt-1 text-sm text-slate-300">
                Everyone can view the board. Only the admin account can update it.
              </p>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Admin User</span>
            <input
              className={inputClassName}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              type="text"
              value={username}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Password</span>
            <input
              className={inputClassName}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              type="password"
              value={password}
            />
          </label>
          <button
            className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            disabled={busy}
            type="submit"
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      )}
    </div>
  );
}
