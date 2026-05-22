from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import AdminToken
from app.schemas.project import (
    DashboardResponse,
    ProjectActivationRequest,
    ProjectListResponse,
    ProjectWrite,
    TeamMemberMutationResponse,
    TeamMemberWrite,
    TaskMutationResponse,
    TaskWrite,
)
from app.services.dashboard_service import dashboard_service
from app.services.realtime_service import realtime_service

router = APIRouter(tags=["projects"])


@router.get("/projects", response_model=ProjectListResponse)
def list_projects() -> ProjectListResponse:
    return ProjectListResponse(projects=dashboard_service.list_projects())


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(project_id: int | None = None) -> DashboardResponse:
    dashboard = dashboard_service.get_dashboard(project_id)
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No project data found.",
        )
    return dashboard


@router.get("/events")
async def stream_dashboard_events() -> StreamingResponse:
    return StreamingResponse(
        realtime_service.stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/projects/activate", response_model=DashboardResponse)
def activate_project(
    payload: ProjectActivationRequest,
    _: AdminToken,
) -> DashboardResponse:
    dashboard = dashboard_service.activate_project(payload.project_id)
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    realtime_service.publish_dashboard_changed(payload.project_id)
    return dashboard


@router.put("/projects/{project_id}", response_model=DashboardResponse)
def update_project(
    project_id: int,
    payload: ProjectWrite,
    _: AdminToken,
) -> DashboardResponse:
    dashboard = dashboard_service.update_project(project_id, payload)
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    realtime_service.publish_dashboard_changed(project_id)
    return dashboard


@router.post("/members", response_model=TeamMemberMutationResponse)
def create_team_member(payload: TeamMemberWrite, _: AdminToken) -> TeamMemberMutationResponse:
    member = dashboard_service.create_team_member(payload)
    realtime_service.publish_dashboard_changed()
    return TeamMemberMutationResponse(member=member)


@router.put("/members/{member_id}", response_model=TeamMemberMutationResponse)
def update_team_member(
    member_id: int,
    payload: TeamMemberWrite,
    _: AdminToken,
) -> TeamMemberMutationResponse:
    member = dashboard_service.update_team_member(member_id, payload)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found.",
        )
    realtime_service.publish_dashboard_changed()
    return TeamMemberMutationResponse(member=member)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(member_id: int, _: AdminToken) -> None:
    if not dashboard_service.delete_team_member(member_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found.",
        )
    realtime_service.publish_dashboard_changed()


@router.post("/tasks", response_model=TaskMutationResponse)
def create_task(payload: TaskWrite, _: AdminToken) -> TaskMutationResponse:
    task = dashboard_service.create_task(payload)
    realtime_service.publish_dashboard_changed(payload.project_id)
    return TaskMutationResponse(task=task)


@router.put("/tasks/{task_id}", response_model=TaskMutationResponse)
def update_task(task_id: int, payload: TaskWrite, _: AdminToken) -> TaskMutationResponse:
    task = dashboard_service.update_task(task_id, payload)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
    realtime_service.publish_dashboard_changed(payload.project_id)
    return TaskMutationResponse(task=task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, _: AdminToken) -> None:
    task = dashboard_service.get_task(task_id)
    if not task or not dashboard_service.delete_task(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )
    realtime_service.publish_dashboard_changed(task["project_id"])
