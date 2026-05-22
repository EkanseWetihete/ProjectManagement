"use client";

import { startTransition, useEffect, useState } from "react";

import {
  activateProject,
  createMember,
  createTask,
  deleteMember,
  deleteTask,
  fetchDashboard,
  getSession,
  loginAdmin,
  logoutAdmin,
  updateMember,
  updateProject,
  updateTask,
} from "@/features/dashboard/api";
import type {
  DashboardResponse,
  LoginPayload,
  ProjectWrite,
  SessionResponse,
  TeamMemberWrite,
  TaskWrite,
} from "@/features/dashboard/types";

const TOKEN_STORAGE_KEY = "studio-board-admin-token";

const EMPTY_SESSION: SessionResponse = {
  authenticated: false,
  user: null,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [session, setSession] = useState<SessionResponse>(EMPTY_SESSION);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function bootstrap(storedToken: string | null, projectId?: number) {
    try {
      const [dashboardData, sessionData] = await Promise.all([
        fetchDashboard(projectId),
        storedToken ? getSession(storedToken) : Promise.resolve(EMPTY_SESSION),
      ]);

      if (sessionData.authenticated && storedToken) {
        setToken(storedToken);
        setSession(sessionData);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setSession(EMPTY_SESSION);
      }

      startTransition(() => setDashboard(dashboardData));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const timer = window.setTimeout(() => {
      void bootstrap(storedToken);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function refresh(projectId?: number) {
    try {
      const nextDashboard = await fetchDashboard(projectId ?? dashboard?.project.id);
      startTransition(() => setDashboard(nextDashboard));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    function handleDashboardChanged(event: MessageEvent<string>) {
      const payload = JSON.parse(event.data) as { project_id?: number | null };
      void refresh(payload.project_id ?? dashboard?.project.id);
    }

    eventSource.addEventListener("dashboard_changed", handleDashboardChanged as EventListener);

    return () => {
      eventSource.removeEventListener(
        "dashboard_changed",
        handleDashboardChanged as EventListener,
      );
      eventSource.close();
    };
  }, [dashboard?.project.id]);

  async function selectProject(projectId: number) {
    setSaving(true);
    setError(null);

    try {
      const nextDashboard =
        session.authenticated && token
          ? await activateProject(projectId, token)
          : await fetchDashboard(projectId);

      startTransition(() => setDashboard(nextDashboard));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  async function signIn(payload: LoginPayload) {
    setSaving(true);
    setError(null);

    try {
      const response = await loginAdmin(payload);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setToken(response.token);
      setSession({ authenticated: true, user: response.user });
      await refresh(dashboard?.project.id);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSaving(true);
    setError(null);

    try {
      if (token) {
        await logoutAdmin(token);
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setSession(EMPTY_SESSION);
      setSaving(false);
    }
  }

  async function saveTask(task: TaskWrite, taskId?: number) {
    if (!token) {
      setError("Administrator login required.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      if (taskId) {
        await updateTask(taskId, task, token);
      } else {
        await createTask(task, token);
      }

      await refresh(task.project_id);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(projectId: number, project: ProjectWrite) {
    if (!token) {
      setError("Administrator login required.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const nextDashboard = await updateProject(projectId, project, token);
      startTransition(() => setDashboard(nextDashboard));
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeTask(taskId: number, projectId: number) {
    if (!token) {
      setError("Administrator login required.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteTask(taskId, token);
      await refresh(projectId);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveMember(member: TeamMemberWrite, memberId?: number) {
    if (!token) {
      setError("Administrator login required.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      if (memberId) {
        await updateMember(memberId, member, token);
      } else {
        await createMember(member, token);
      }

      await refresh(dashboard?.project.id);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(memberId: number) {
    if (!token) {
      setError("Administrator login required.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteMember(memberId, token);
      await refresh(dashboard?.project.id);
      return true;
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    dashboard,
    error,
    loading,
    saving,
    session,
    actions: {
      refresh,
      removeMember,
      removeTask,
      saveProject,
      saveMember,
      saveTask,
      selectProject,
      signIn,
      signOut,
    },
  };
}
