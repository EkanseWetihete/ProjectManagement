from fastapi import APIRouter, Depends

from app.api.deps import require_app_client
from app.api.routes import auth, projects

api_router = APIRouter(prefix="/api", dependencies=[Depends(require_app_client)])
api_router.include_router(auth.router)
api_router.include_router(projects.router)
