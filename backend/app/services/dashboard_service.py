from datetime import date

from app.repositories.dashboard_repository import dashboard_repository
from app.schemas.project import (
    DashboardResponse,
    ProjectWrite,
    TaskSummary,
    TaskWrite,
    TeamMember,
    TeamMemberWrite,
)


COLUMN_LABELS = {
    "todo": "To Do",
    "in_progress": "In Progress",
    "review": "Review",
    "done": "Done",
}


class DashboardService:
    def list_projects(self) -> list[dict]:
        projects = dashboard_repository.list_projects()
        return [self._serialize_project(project) for project in projects]

    def get_dashboard(self, project_id: int | None = None) -> DashboardResponse | None:
        project = (
            dashboard_repository.get_project(project_id)
            if project_id
            else dashboard_repository.get_active_project()
        )
        if not project:
            return None

        return self._build_dashboard(project)

    def activate_project(self, project_id: int) -> DashboardResponse | None:
        project = dashboard_repository.activate_project(project_id)
        if not project:
            return None
        return self._build_dashboard(project)

    def update_project(self, project_id: int, payload: ProjectWrite) -> DashboardResponse | None:
        project = dashboard_repository.update_project(project_id, self._project_payload(payload))
        if not project:
            return None
        return self._build_dashboard(project)

    def create_task(self, payload: TaskWrite) -> dict:
        task = dashboard_repository.create_task(self._task_payload(payload))
        return self._serialize_task(task)

    def update_task(self, task_id: int, payload: TaskWrite) -> dict | None:
        task = dashboard_repository.update_task(task_id, self._task_payload(payload))
        return self._serialize_task(task) if task else None

    def delete_task(self, task_id: int) -> bool:
        return dashboard_repository.delete_task(task_id)

    def create_team_member(self, payload: TeamMemberWrite) -> dict:
        member = dashboard_repository.create_team_member(self._team_member_payload(payload))
        return self._serialize_team_member(member)

    def update_team_member(self, member_id: int, payload: TeamMemberWrite) -> dict | None:
        member = dashboard_repository.update_team_member(member_id, self._team_member_payload(payload))
        return self._serialize_team_member(member) if member else None

    def delete_team_member(self, member_id: int) -> bool:
        return dashboard_repository.delete_team_member(member_id)

    def _build_dashboard(self, project: dict) -> DashboardResponse:
        tasks = [self._serialize_task(task) for task in dashboard_repository.list_tasks(project["id"])]
        team = self._build_team(tasks)
        today = date.today()
        columns = [
            {
                "id": column_id,
                "label": label,
                "task_count": sum(1 for task in tasks if task["status"] == column_id),
            }
            for column_id, label in COLUMN_LABELS.items()
        ]

        return DashboardResponse(
            project=self._serialize_project(project),
            projects=self.list_projects(),
            columns=columns,
            tasks=tasks,
            team=team,
            stats={
                "total_tasks": len(tasks),
                "completed_tasks": sum(1 for task in tasks if task["status"] == "done"),
                "overdue_tasks": sum(
                    1 for task in tasks if task["status"] != "done" and task["end_date"] < today
                ),
                "active_members": len([member for member in team if member.task_count > 0]),
            },
        )

    def _build_team(self, tasks: list[dict]) -> list[TeamMember]:
        members = {
            member["id"]: TeamMember(**member)
            for member in dashboard_repository.list_team_members()
        }

        for task in tasks:
            for assignee in task["assignees"]:
                assignee_id = assignee["id"]
                if assignee_id in members:
                    members[assignee_id].task_count += 1

        return list(members.values())

    def _serialize_project(self, project: dict) -> dict:
        return {
            "id": project["id"],
            "name": project["name"],
            "code_name": project["code_name"],
            "description": project["description"],
            "is_active": bool(project["is_active"]),
        }

    def _serialize_task(self, task: dict) -> dict:
        return TaskSummary(
            id=task["id"],
            project_id=task["project_id"],
            title=task["title"],
            description=task["description"],
            status=task["status"],
            priority=task["priority"],
            assignees=task["assignees"],
            objectives=task["objectives"],
            start_date=task["start_date"],
            end_date=task["end_date"],
            parent_task_id=task["parent_task_id"],
            parent_title=task["parent_title"],
            progress=task["progress"],
            sort_order=task["sort_order"],
        ).model_dump()

    def _serialize_team_member(self, member: dict) -> dict:
        return TeamMember(
            id=member["id"],
            name=member["name"],
            role=member["role"],
            accent_color=member["accent_color"],
            task_count=member.get("task_count", 0),
        ).model_dump()

    def _task_payload(self, payload: TaskWrite) -> dict:
        assignee_ids = list(dict.fromkeys(payload.assignee_ids))
        return {
            "project_id": payload.project_id,
            "title": payload.title,
            "description": payload.description,
            "status": payload.status,
            "priority": payload.priority,
            "primary_assignee_id": assignee_ids[0] if assignee_ids else None,
            "assignee_ids": assignee_ids,
            "objectives": [
                {
                    "title": objective.title.strip(),
                    "started": objective.started,
                    "assignee_ids": list(dict.fromkeys(objective.assignee_ids)),
                    "sort_order": index * 10,
                }
                for index, objective in enumerate(payload.objectives, start=1)
                if objective.title.strip()
            ],
            "start_date": payload.start_date.isoformat(),
            "end_date": payload.end_date.isoformat(),
            "parent_task_id": payload.parent_task_id,
            "progress": payload.progress,
            "sort_order": payload.sort_order,
        }

    def _project_payload(self, payload: ProjectWrite) -> dict:
        return {
            "name": payload.name.strip(),
            "description": payload.description.strip(),
        }

    def _team_member_payload(self, payload: TeamMemberWrite) -> dict:
        return {
            "name": payload.name.strip(),
            "role": payload.role.strip(),
            "accent_color": payload.accent_color.lower(),
        }


dashboard_service = DashboardService()
