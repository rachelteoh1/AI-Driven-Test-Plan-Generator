from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

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
    role: str | None = None
    pref_darkmode: bool | None = None
    pref_autosave: bool | None = None
