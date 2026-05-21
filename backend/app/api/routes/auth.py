from fastapi import APIRouter, Header, HTTPException, status

from app.schemas.auth import LoginRequest, LoginResponse, SessionResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    session = auth_service.login(payload.username, payload.password)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials.",
        )

    return LoginResponse(token=session["token"], user=session["user"])


@router.get("/session", response_model=SessionResponse)
def get_session(authorization: str | None = Header(default=None)) -> SessionResponse:
    token = _get_token(authorization)
    session = auth_service.get_session(token) if token else None
    return SessionResponse(
        authenticated=bool(session),
        user=session["user"] if session else None,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(authorization: str | None = Header(default=None)) -> None:
    token = _get_token(authorization)
    if token:
        auth_service.logout(token)
