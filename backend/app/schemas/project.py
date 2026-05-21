from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


TaskStatus = Literal["todo", "in_progress", "review", "done"]
TaskPriority = Literal["low", "medium", "high"]


class ProjectSummary(BaseModel):
    id: int
    name: str
    code_name: str
    description: str
    is_active: bool


class TeamMember(BaseModel):
    id: int
    name: str
    role: str
    accent_color: str
    task_count: int = 0


class TeamMemberWrite(BaseModel):
    name: str = Field(min_length=1)
    role: str = Field(min_length=1)
    accent_color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class TaskAssignee(BaseModel):
    id: int
    name: str
    role: str
    accent_color: str


class TaskObjectiveSummary(BaseModel):
    id: int
    title: str
    started: bool = False
    assignees: list[TaskAssignee] = Field(default_factory=list)


class TaskObjectiveWrite(BaseModel):
    title: str = ""
    started: bool = False
    assignee_ids: list[int] = Field(default_factory=list)


class TaskSummary(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    assignees: list[TaskAssignee] = Field(default_factory=list)
    objectives: list[TaskObjectiveSummary] = Field(default_factory=list)
    start_date: date
    end_date: date
    parent_task_id: int | None
    parent_title: str | None
    progress: int = Field(ge=0, le=100)
    sort_order: int


class BoardColumn(BaseModel):
    id: TaskStatus
    label: str
    task_count: int


class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    active_members: int


class DashboardResponse(BaseModel):
    project: ProjectSummary
    projects: list[ProjectSummary]
    columns: list[BoardColumn]
    tasks: list[TaskSummary]
    team: list[TeamMember]
    stats: DashboardStats


class ProjectListResponse(BaseModel):
    projects: list[ProjectSummary]


class ProjectActivationRequest(BaseModel):
    project_id: int


class ProjectWrite(BaseModel):
    name: str = Field(min_length=1)
    description: str


class TaskWrite(BaseModel):
    project_id: int
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    assignee_ids: list[int] = Field(default_factory=list)
    objectives: list[TaskObjectiveWrite] = Field(default_factory=list)
    start_date: date
    end_date: date
    parent_task_id: int | None = None
    progress: int = Field(ge=0, le=100)
    sort_order: int = 0


class TaskMutationResponse(BaseModel):
    task: TaskSummary


class TeamMemberMutationResponse(BaseModel):
    member: TeamMember
