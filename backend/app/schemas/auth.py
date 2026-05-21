from pydantic import BaseModel


class UserSession(BaseModel):
    username: str
    role: str = "admin"


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: UserSession


class SessionResponse(BaseModel):
    authenticated: bool
    user: UserSession | None = None
