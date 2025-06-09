from uuid import UUID
from pydantic import BaseModel

#pydantic modal for data validation purposes

class LogCreate(BaseModel):  #save message
    session_id: UUID
    role: str
    content: str
    

class LogResponse(BaseModel):  # display message
    message_id:UUID
    session_id:UUID
    role: str
    content: str




