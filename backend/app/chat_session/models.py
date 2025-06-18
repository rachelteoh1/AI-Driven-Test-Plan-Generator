from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

#data validation

class ChatCreateRequest(BaseModel):
    id: UUID   #userID
    title: str
    login_session_id: UUID

class ChatRenameRequest(BaseModel):
    session_id: UUID
    new_title: str

class ChatResponse(BaseModel):
    session_id: UUID
    id: UUID    #userID
    title: str
    created_at: datetime
    updated_at: datetime