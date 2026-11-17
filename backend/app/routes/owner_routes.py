from fastapi import APIRouter, Depends

from app.controllers import owner_controller
from app.core.dependencies import bearer_scheme
from app.routes import paths
from app.views.owner import OwnerProfileResponse

router = APIRouter(
    prefix=paths.OWNER,
    tags=["Owner Profile"],
    dependencies=[Depends(bearer_scheme)],
)

router.add_api_route(
    paths.OWNER_PROFILE,
    owner_controller.get_profile,
    methods=["GET"],
    response_model=OwnerProfileResponse,
    summary="Get logged-in owner profile",
)

router.add_api_route(
    paths.OWNER_PROFILE,
    owner_controller.update_profile,
    methods=["PUT"],
    response_model=OwnerProfileResponse,
    summary="Update logged-in owner profile",
)
