from datetime import UTC, datetime

from app.db.database import get_connection


class AuthRepository:
    def create_session(self, token: str, username: str, expires_at: datetime) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO sessions (token, username, expires_at)
                VALUES (?, ?, ?)
                """,
                (token, username, expires_at.astimezone(UTC).isoformat()),
            )

    def get_session(self, token: str) -> dict | None:
        with get_connection() as connection:
            row = connection.execute(
                "SELECT token, username, expires_at FROM sessions WHERE token = ?",
                (token,),
            ).fetchone()

            if not row:
                return None

            expires_at = datetime.fromisoformat(row["expires_at"])
            if expires_at <= datetime.now(UTC):
                connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
                return None

            return {
                "token": row["token"],
                "username": row["username"],
                "expires_at": expires_at,
            }

    def delete_session(self, token: str) -> None:
        with get_connection() as connection:
            connection.execute("DELETE FROM sessions WHERE token = ?", (token,))


auth_repository = AuthRepository()
