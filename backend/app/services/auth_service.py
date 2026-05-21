from datetime import UTC, datetime, timedelta
import secrets

from app.core.config import settings
from app.repositories.auth_repository import auth_repository


class AuthService:
    def login(self, username: str, password: str) -> dict | None:
        if not (
            secrets.compare_digest(username, settings.admin_username)
            and secrets.compare_digest(password, settings.admin_password)
        ):
            return None

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(hours=settings.session_hours)
        auth_repository.create_session(token, username, expires_at)
        return {
            "token": token,
            "user": {"username": username, "role": "admin"},
        }

    def get_session(self, token: str | None) -> dict | None:
        if not token:
            return None

        session = auth_repository.get_session(token)
        if not session:
            return None

        return {
            "token": session["token"],
            "user": {"username": session["username"], "role": "admin"},
        }

    def logout(self, token: str) -> None:
        auth_repository.delete_session(token)


auth_service = AuthService()
