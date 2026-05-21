from sqlite3 import Connection


PROJECTS = [
    {
        "name": "PAW Project",
        "code_name": "Project Anime World RPG",
        "description": "Compact production board for a small game team.",
        "is_active": 1,
    }
]

MEMBERS = [
    {"name": "Snake", "role": "Producer", "accent_color": "#7c8dff"},
    {"name": "Trust", "role": "Artist", "accent_color": "#42c9a1"},
    {"name": "Aster", "role": "Programmer", "accent_color": "#ffb454"},
    {"name": "Nia", "role": "Writer", "accent_color": "#ff6f91"},
]

TASKS = [
    {
        "project_id": 1,
        "title": "PLANNING",
        "description": "Tasks related to Planning",
        "status": "todo",
        "priority": "high",
        "assignee_id": 1,
        "start_date": "2026-05-20",
        "end_date": "2026-07-31",
        "parent_task_id": None,
        "progress": 29,
        "sort_order": 10,
    },
    {
        "project_id": 1,
        "title": "Game Concept & Theme",
        "description": "Define the core game concept, theme and target audience. Brainstorm unique mechanics.",
        "status": "todo",
        "priority": "high",
        "assignee_id": 1,
        "start_date": "2026-05-20",
        "end_date": "2026-06-25",
        "parent_task_id": 1,
        "progress": 18,
        "sort_order": 20,
    },
    {
        "project_id": 1,
        "title": "Game Design Document",
        "description": "Create a base GDD with the rules, controls, loop and level goals.",
        "status": "todo",
        "priority": "high",
        "assignee_id": 2,
        "start_date": "2026-06-25",
        "end_date": "2026-07-31",
        "parent_task_id": 1,
        "progress": 10,
        "sort_order": 30,
    },
    {
        "project_id": 1,
        "title": "ART",
        "description": "Tasks related to art direction and asset planning.",
        "status": "todo",
        "priority": "high",
        "assignee_id": 2,
        "start_date": "2026-05-20",
        "end_date": "2026-07-31",
        "parent_task_id": None,
        "progress": 15,
        "sort_order": 40,
    },
    {
        "project_id": 1,
        "title": "Art Style & Visual Direction",
        "description": "Define the visual language, palette and silhouette rules for the game.",
        "status": "todo",
        "priority": "high",
        "assignee_id": 2,
        "start_date": "2026-05-20",
        "end_date": "2026-06-03",
        "parent_task_id": 4,
        "progress": 30,
        "sort_order": 50,
    },
    {
        "project_id": 1,
        "title": "Player Character Sprites",
        "description": "Create the player sprite set with idle, walk and action poses.",
        "status": "todo",
        "priority": "high",
        "assignee_id": 1,
        "start_date": "2026-06-03",
        "end_date": "2026-06-17",
        "parent_task_id": 4,
        "progress": 22,
        "sort_order": 60,
    },
    {
        "project_id": 1,
        "title": "Enemy Design & Sprites",
        "description": "Design enemy silhouettes and build sprite variations with readable attacks.",
        "status": "todo",
        "priority": "medium",
        "assignee_id": 2,
        "start_date": "2026-06-17",
        "end_date": "2026-07-01",
        "parent_task_id": 4,
        "progress": 8,
        "sort_order": 70,
    },
    {
        "project_id": 1,
        "title": "Combat Prototype",
        "description": "Hook up a playable encounter with hit detection and a first pass of balancing.",
        "status": "in_progress",
        "priority": "high",
        "assignee_id": 3,
        "start_date": "2026-05-24",
        "end_date": "2026-06-18",
        "parent_task_id": None,
        "progress": 44,
        "sort_order": 10,
    },
    {
        "project_id": 1,
        "title": "Quest Writing Pass",
        "description": "Draft the first-town quest arc and review pacing before implementation.",
        "status": "review",
        "priority": "medium",
        "assignee_id": 4,
        "start_date": "2026-05-26",
        "end_date": "2026-06-12",
        "parent_task_id": None,
        "progress": 90,
        "sort_order": 10,
    },
    {
        "project_id": 1,
        "title": "Input Mapping Sheet",
        "description": "Finalize the control list and publish it for implementation.",
        "status": "done",
        "priority": "low",
        "assignee_id": 3,
        "start_date": "2026-05-20",
        "end_date": "2026-05-23",
        "parent_task_id": None,
        "progress": 100,
        "sort_order": 10,
    },
    {
        "project_id": 2,
        "title": "Trailer Cut Outline",
        "description": "Outline key beats for the release teaser trailer.",
        "status": "todo",
        "priority": "medium",
        "assignee_id": 4,
        "start_date": "2026-07-02",
        "end_date": "2026-07-12",
        "parent_task_id": None,
        "progress": 0,
        "sort_order": 10,
    },
]


def seed_database(connection: Connection) -> None:
    project_count = connection.execute("SELECT COUNT(*) AS count FROM projects").fetchone()["count"]
    if project_count:
        return

    for project in PROJECTS:
        connection.execute(
            """
            INSERT INTO projects (name, code_name, description, is_active)
            VALUES (:name, :code_name, :description, :is_active)
            """,
            project,
        )

    for member in MEMBERS:
        connection.execute(
            """
            INSERT INTO members (name, role, accent_color)
            VALUES (:name, :role, :accent_color)
            """,
            member,
        )

    for task in TASKS:
        connection.execute(
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
            VALUES (
                :project_id,
                :title,
                :description,
                :status,
                :priority,
                :assignee_id,
                :start_date,
                :end_date,
                :parent_task_id,
                :progress,
                :sort_order
            )
            """,
            task,
        )
