from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings
from app.services.auth_service import auth_service


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


def require_admin(authorization: Annotated[str | None, Header()] = None) -> str:
    token = _extract_bearer_token(authorization)
    if not token or not auth_service.get_session(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrator login required.",
        )

    return token


def require_app_client(
    project_client_key: Annotated[str | None, Header(alias="X-Project-Client-Key")] = None,
) -> str:
    expected_key = settings.app_client_key.strip()
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API client key is not configured.",
        )

    if project_client_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid application client key.",
        )

    return project_client_key


AdminToken = Annotated[str, Depends(require_admin)]
