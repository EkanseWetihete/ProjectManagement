from sqlite3 import Connection, Row

from app.db.database import get_connection


TASK_SELECT = """
SELECT
    tasks.id,
    tasks.project_id,
    tasks.title,
    tasks.description,
    tasks.status,
    tasks.priority,
    tasks.start_date,
    tasks.end_date,
    tasks.parent_task_id,
    tasks.progress,
    tasks.sort_order,
    parents.title AS parent_title
FROM tasks
LEFT JOIN tasks AS parents ON parents.id = tasks.parent_task_id
"""


TASK_QUERY = TASK_SELECT + """
WHERE tasks.project_id = ?
ORDER BY tasks.status, tasks.sort_order, tasks.id
"""


TASK_BY_ID_QUERY = TASK_SELECT + """
WHERE tasks.id = ?
LIMIT 1
"""


def _to_dict(row: Row | None) -> dict | None:
    return dict(row) if row else None


def _build_placeholders(values: list[int]) -> str:
    return ", ".join("?" for _ in values)


class DashboardRepository:
    def list_projects(self) -> list[dict]:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT id, name, code_name, description, is_active
                FROM projects
                ORDER BY is_active DESC, id ASC
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def get_project(self, project_id: int) -> dict | None:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT id, name, code_name, description, is_active FROM projects WHERE id = ?",
                (project_id,),
            ).fetchone()
        return _to_dict(row)

    def get_active_project(self) -> dict | None:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT id, name, code_name, description, is_active FROM projects WHERE is_active = 1 LIMIT 1"
            ).fetchone()
        return _to_dict(row)

    def activate_project(self, project_id: int) -> dict | None:
        with get_connection() as connection:
            connection.execute("UPDATE projects SET is_active = 0")
            cursor = connection.execute(
                "UPDATE projects SET is_active = 1 WHERE id = ?",
                (project_id,),
            )
            if cursor.rowcount == 0:
                connection.rollback()
                return None

            row = connection.execute(
                "SELECT id, name, code_name, description, is_active FROM projects WHERE id = ?",
                (project_id,),
            ).fetchone()
        return _to_dict(row)

    def update_project(self, project_id: int, payload: dict) -> dict | None:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE projects
                SET name = ?,
                    description = ?
                WHERE id = ?
                """,
                (
                    payload["name"],
                    payload["description"],
                    project_id,
                ),
            )
            if cursor.rowcount == 0:
                return None

            row = connection.execute(
                "SELECT id, name, code_name, description, is_active FROM projects WHERE id = ?",
                (project_id,),
            ).fetchone()
        return _to_dict(row)

    def list_team_members(self) -> list[dict]:
        with get_connection() as connection:
            rows = connection.execute(
                "SELECT id, name, role, accent_color FROM members ORDER BY id"
            ).fetchall()
        return [dict(row) for row in rows]

    def create_team_member(self, payload: dict) -> dict:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO members (name, role, accent_color)
                VALUES (?, ?, ?)
                """,
                (
                    payload["name"],
                    payload["role"],
                    payload["accent_color"],
                ),
            )
            row = connection.execute(
                "SELECT id, name, role, accent_color FROM members WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()
        return dict(row)

    def update_team_member(self, member_id: int, payload: dict) -> dict | None:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE members
                SET name = ?,
                    role = ?,
                    accent_color = ?
                WHERE id = ?
                """,
                (
                    payload["name"],
                    payload["role"],
                    payload["accent_color"],
                    member_id,
                ),
            )
            if cursor.rowcount == 0:
                return None

            row = connection.execute(
                "SELECT id, name, role, accent_color FROM members WHERE id = ?",
                (member_id,),
            ).fetchone()
        return dict(row) if row else None

    def delete_team_member(self, member_id: int) -> bool:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM members WHERE id = ?", (member_id,))
        return cursor.rowcount > 0

    def list_tasks(self, project_id: int) -> list[dict]:
        with get_connection() as connection:
            rows = connection.execute(TASK_QUERY, (project_id,)).fetchall()
            tasks = [dict(row) for row in rows]
            return self._attach_task_relations(connection, tasks)

    def get_task(self, task_id: int) -> dict | None:
        with get_connection() as connection:
            return self._get_task_with_relations(connection, task_id)

    def create_task(self, payload: dict) -> dict:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO tasks (
                    project_id,
                    title,
                    description,
                    status,
                    priority,
                    assignee_id,
                    start_date,
                    end_date,
                    parent_task_id,
                    progress,
                    sort_order
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload["project_id"],
                    payload["title"],
                    payload["description"],
                    payload["status"],
                    payload["priority"],
                    payload["primary_assignee_id"],
                    payload["start_date"],
                    payload["end_date"],
                    payload["parent_task_id"],
                    payload["progress"],
                    payload["sort_order"],
                ),
            )
            task_id = cursor.lastrowid
            self._replace_task_assignments(connection, task_id, payload["assignee_ids"])
            self._replace_task_objectives(connection, task_id, payload["objectives"])
            return self._get_task_with_relations(connection, task_id)

    def update_task(self, task_id: int, payload: dict) -> dict | None:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE tasks
                SET project_id = ?,
                    title = ?,
                    description = ?,
                    status = ?,
                    priority = ?,
                    assignee_id = ?,
                    start_date = ?,
                    end_date = ?,
                    parent_task_id = ?,
                    progress = ?,
                    sort_order = ?
                WHERE id = ?
                """,
                (
                    payload["project_id"],
                    payload["title"],
                    payload["description"],
                    payload["status"],
                    payload["priority"],
                    payload["primary_assignee_id"],
                    payload["start_date"],
                    payload["end_date"],
                    payload["parent_task_id"],
                    payload["progress"],
                    payload["sort_order"],
                    task_id,
                ),
            )
            if cursor.rowcount == 0:
                return None

            self._replace_task_assignments(connection, task_id, payload["assignee_ids"])
            self._replace_task_objectives(connection, task_id, payload["objectives"])
            return self._get_task_with_relations(connection, task_id)

    def delete_task(self, task_id: int) -> bool:
        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        return cursor.rowcount > 0

    def _attach_task_relations(self, connection: Connection, tasks: list[dict]) -> list[dict]:
        if not tasks:
            return tasks

        task_ids = [task["id"] for task in tasks]
        assignees_by_task = self._load_task_assignees(connection, task_ids)
        objectives_by_task = self._load_task_objectives(connection, task_ids)

        for task in tasks:
            task["assignees"] = assignees_by_task.get(task["id"], [])
            task["objectives"] = objectives_by_task.get(task["id"], [])

        return tasks

    def _load_task_assignees(
        self,
        connection: Connection,
        task_ids: list[int],
    ) -> dict[int, list[dict]]:
        placeholders = _build_placeholders(task_ids)
        rows = connection.execute(
            f"""
            SELECT
                task_assignments.task_id,
                members.id,
                members.name,
                members.role,
                members.accent_color
            FROM task_assignments
            JOIN members ON members.id = task_assignments.member_id
            WHERE task_assignments.task_id IN ({placeholders})
            ORDER BY task_assignments.task_id, members.id
            """,
            task_ids,
        ).fetchall()

        assignees_by_task: dict[int, list[dict]] = {task_id: [] for task_id in task_ids}
        for row in rows:
            assignees_by_task[row["task_id"]].append(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "role": row["role"],
                    "accent_color": row["accent_color"],
                }
            )

        return assignees_by_task

    def _load_task_objectives(
        self,
        connection: Connection,
        task_ids: list[int],
    ) -> dict[int, list[dict]]:
        placeholders = _build_placeholders(task_ids)
        objective_rows = connection.execute(
            f"""
            SELECT id, task_id, title, started, sort_order
            FROM task_objectives
            WHERE task_id IN ({placeholders})
            ORDER BY task_id, sort_order, id
            """,
            task_ids,
        ).fetchall()

        objective_ids = [row["id"] for row in objective_rows]
        objective_assignments: dict[int, list[dict]] = {objective_id: [] for objective_id in objective_ids}

        if objective_ids:
            objective_placeholders = _build_placeholders(objective_ids)
            assignment_rows = connection.execute(
                f"""
                SELECT
                    objective_assignments.objective_id,
                    members.id,
                    members.name,
                    members.role,
                    members.accent_color
                FROM objective_assignments
                JOIN members ON members.id = objective_assignments.member_id
                WHERE objective_assignments.objective_id IN ({objective_placeholders})
                ORDER BY objective_assignments.objective_id, members.id
                """,
                objective_ids,
            ).fetchall()

            for row in assignment_rows:
                objective_assignments[row["objective_id"]].append(
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "role": row["role"],
                        "accent_color": row["accent_color"],
                    }
                )

        objectives_by_task: dict[int, list[dict]] = {task_id: [] for task_id in task_ids}
        for row in objective_rows:
            objectives_by_task[row["task_id"]].append(
                {
                    "id": row["id"],
                    "title": row["title"],
                    "started": bool(row["started"]),
                    "assignees": objective_assignments.get(row["id"], []),
                }
            )

        return objectives_by_task

    def _replace_task_assignments(
        self,
        connection: Connection,
        task_id: int,
        assignee_ids: list[int],
    ) -> None:
        connection.execute("DELETE FROM task_assignments WHERE task_id = ?", (task_id,))

        for member_id in dict.fromkeys(assignee_ids):
            connection.execute(
                "INSERT INTO task_assignments (task_id, member_id) VALUES (?, ?)",
                (task_id, member_id),
            )

    def _replace_task_objectives(
        self,
        connection: Connection,
        task_id: int,
        objectives: list[dict],
    ) -> None:
        connection.execute(
            "DELETE FROM objective_assignments WHERE objective_id IN (SELECT id FROM task_objectives WHERE task_id = ?)",
            (task_id,),
        )
        connection.execute("DELETE FROM task_objectives WHERE task_id = ?", (task_id,))

        for index, objective in enumerate(objectives, start=1):
            cursor = connection.execute(
                """
                INSERT INTO task_objectives (task_id, title, started, sort_order)
                VALUES (?, ?, ?, ?)
                """,
                (
                    task_id,
                    objective["title"],
                    int(objective["started"]),
                    objective.get("sort_order", index * 10),
                ),
            )

            for member_id in dict.fromkeys(objective["assignee_ids"]):
                connection.execute(
                    "INSERT INTO objective_assignments (objective_id, member_id) VALUES (?, ?) ",
                    (cursor.lastrowid, member_id),
                )

    def _get_task_with_relations(self, connection: Connection, task_id: int) -> dict | None:
        row = connection.execute(TASK_BY_ID_QUERY, (task_id,)).fetchone()
        task = _to_dict(row)
        if not task:
            return None

        return self._attach_task_relations(connection, [task])[0]


dashboard_repository = DashboardRepository()