from fastapi import APIRouter, status
from ..database import DbSession
from ..auth.service import CurrentUser
from . import service, models

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/currentUser", response_model=models.UserResponse)
def get_current_user(current_user: CurrentUser, db: DbSession):
    return service.get_user_by_id(db, current_user.get_uuid())

@router.post("/reset-password")
def request_password_reset(request: models.PasswordResetRequest, db: DbSession):
    return service.handle_reset_request(db, request)



@router.post("/reset-password/confirm")
def confirm_password_reset(data: models.PasswordResetConfirm, db: DbSession):
    service.reset_password_confirm(db, data)
    return {"message": "Password reset successful."}

