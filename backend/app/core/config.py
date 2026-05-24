from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = Path(__file__).resolve().parents[3]

load_dotenv(PROJECT_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str = "Project Management API"
    server_host: str = os.getenv("PM_BACKEND_HOST", "0.0.0.0")
    server_port: int = int(os.getenv("PM_BACKEND_PORT", "8000"))
    app_client_key: str = os.getenv("PM_APP_CLIENT_KEY", "")
    admin_username: str = os.getenv("PM_ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("PM_ADMIN_PASSWORD", "change-me")
    session_hours: int = int(os.getenv("PM_SESSION_HOURS", "12"))
    raw_cors_origins: str = os.getenv(
        "PM_CORS_ORIGINS",
        "*",
    )
    database_path: Path = BACKEND_DIR / "data" / "project_manager.db"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.raw_cors_origins.split(",") if origin.strip()]


settings = Settings()
