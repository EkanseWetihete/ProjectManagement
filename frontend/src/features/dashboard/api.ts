import type {
  DashboardResponse,
  LoginPayload,
  LoginResponse,
  ProjectWrite,
  SessionResponse,
  TeamMemberMutationResponse,
  TeamMemberWrite,
  TaskMutationResponse,
  TaskWrite,
} from "@/features/dashboard/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string | Array<{ loc?: Array<string | number>; msg?: string }> }
      | null;

    throw new Error(formatErrorDetail(payload?.detail));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function formatErrorDetail(
  detail: string | Array<{ loc?: Array<string | number>; msg?: string }> | undefined,
) {
  if (!detail) {
    return "Request failed.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  return detail
    .map((issue) => {
      const path = issue.loc?.slice(1).join(".");
      return path ? `${path}: ${issue.msg ?? "Invalid value."}` : issue.msg ?? "Invalid value.";
    })
    .join(" | ");
}

export function fetchDashboard(projectId?: number) {
  const query = projectId ? `?project_id=${projectId}` : "";
  return request<DashboardResponse>(`/api/dashboard${query}`, { cache: "no-store" });
}

export function loginAdmin(payload: LoginPayload) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSession(token: string) {
  return request<SessionResponse>("/api/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export function logoutAdmin(token: string) {
  return request<void>("/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function activateProject(projectId: number, token: string) {
  return request<DashboardResponse>("/api/projects/activate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ project_id: projectId }),
  });
}

export function updateProject(projectId: number, payload: ProjectWrite, token: string) {
  return request<DashboardResponse>(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function createMember(payload: TeamMemberWrite, token: string) {
  return request<TeamMemberMutationResponse>("/api/members", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateMember(memberId: number, payload: TeamMemberWrite, token: string) {
  return request<TeamMemberMutationResponse>(`/api/members/${memberId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteMember(memberId: number, token: string) {
  return request<void>(`/api/members/${memberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createTask(payload: TaskWrite, token: string) {
  return request<TaskMutationResponse>("/api/tasks", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateTask(taskId: number, payload: TaskWrite, token: string) {
  return request<TaskMutationResponse>(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteTask(taskId: number, token: string) {
  return request<void>(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
