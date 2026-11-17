from fastapi import APIRouter, Depends, status

from app.controllers import pet_controller
from app.core.dependencies import bearer_scheme
from app.routes import paths
from app.views.pet import PetResponse

router = APIRouter(
    prefix=paths.PETS,
    tags=["Pets"],
    dependencies=[Depends(bearer_scheme)],
)

router.add_api_route(
    "",
    pet_controller.list_pets,
    methods=["GET"],
    response_model=list[PetResponse],
    summary="List all pets for the current owner",
)

router.add_api_route(
    paths.PET_BY_ID,
    pet_controller.get_pet,
    methods=["GET"],
    response_model=PetResponse,
    summary="Get one pet by ID",
)

router.add_api_route(
    "",
    pet_controller.create_pet,
    methods=["POST"],
    response_model=PetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new pet profile",
)

router.add_api_route(
    paths.PET_BY_ID,
    pet_controller.update_pet,
    methods=["PUT"],
    response_model=PetResponse,
    summary="Update a pet profile",
)

router.add_api_route(
    paths.PET_BY_ID,
    pet_controller.delete_pet,
    methods=["DELETE"],
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a pet profile",
)
