from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    new_password_confirm: str

class UserProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    username: str | None
    role: str
    date_joined: datetime
    pref_darkmode: bool
    pref_autosave: bool

    class Config:
        orm_mode = True


class UserProfileUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    pref_darkmode: bool | None = None
    pref_autosave: bool | None = None