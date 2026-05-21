export type ViewMode = "kanban" | "gantt" | "list" | "team";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ProjectSummary {
  id: number;
  name: string;
  code_name: string;
  description: string;
  is_active: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  accent_color: string;
  task_count: number;
}

export interface TeamMemberWrite {
  name: string;
  role: string;
  accent_color: string;
}

export interface TaskAssignee {
  id: number;
  name: string;
  role: string;
  accent_color: string;
}

export interface TaskObjective {
  id: number;
  title: string;
  started: boolean;
  assignees: TaskAssignee[];
}

export interface TaskSummary {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: TaskAssignee[];
  objectives: TaskObjective[];
  start_date: string;
  end_date: string;
  parent_task_id: number | null;
  parent_title: string | null;
  progress: number;
  sort_order: number;
}

export interface BoardColumn {
  id: TaskStatus;
  label: string;
  task_count: number;
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  active_members: number;
}

export interface DashboardResponse {
  project: ProjectSummary;
  projects: ProjectSummary[];
  columns: BoardColumn[];
  tasks: TaskSummary[];
  team: TeamMember[];
  stats: DashboardStats;
}

export interface UserSession {
  username: string;
  role: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ProjectWrite {
  name: string;
  description: string;
}

export interface LoginResponse {
  token: string;
  user: UserSession;
}

export interface SessionResponse {
  authenticated: boolean;
  user: UserSession | null;
}

export interface TaskObjectiveWrite {
  title: string;
  started: boolean;
  assignee_ids: number[];
}

export interface TaskWrite {
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_ids: number[];
  objectives: TaskObjectiveWrite[];
  start_date: string;
  end_date: string;
  parent_task_id: number | null;
  progress: number;
  sort_order: number;
}

export interface TaskMutationResponse {
  task: TaskSummary;
}

export interface TeamMemberMutationResponse {
  member: TeamMember;
}
