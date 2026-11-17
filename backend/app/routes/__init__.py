from fastapi import APIRouter

from app.routes import auth_routes, owner_routes, paths, pet_routes, task_routes

api_router = APIRouter(prefix=paths.API_PREFIX)
api_router.include_router(auth_routes.router)
api_router.include_router(owner_routes.router)
api_router.include_router(pet_routes.router)
api_router.include_router(task_routes.router)
