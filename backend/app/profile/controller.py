from fastapi import APIRouter
from ..database import DbSession
from ..auth.service import CurrentUser
from . import service, models

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)

@router.get("/", response_model=models.UserProfileResponse)
def get_user_profile(current_user: CurrentUser, db: DbSession):
    return service.get_user_by_id(db, current_user.get_uuid())

@router.put("/", response_model=models.UserProfileResponse)
def update_user_profile(
    update: models.UserProfileUpdate,
    db: DbSession,
    current_user: CurrentUser
):
    return service.update_user_profile(db, current_user.get_uuid(), update)
