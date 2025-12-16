from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from typing import Optional

#pydantic modal for data validation purposes

class LogCreate(BaseModel):  #save message
    session_id: UUID
    role: str
    content: str

class InstrumentResponse(BaseModel):
    manufacturer: Optional[str]
    model: Optional[str]
    serial: Optional[str]
    
class LogResponse(BaseModel):
    message_id: UUID
    session_id: UUID
    role: str
    content: str
    timestamp: datetime
    has_been_modified: bool
    has_optimization: bool = False
    selected_instrument: Optional[InstrumentResponse] = None
    
class ModifyLog(BaseModel):
    message_id: UUID
    session_id: UUID
    role: str
    content: str
    has_been_modified: bool 
    
class ChatLogVersionResponse(BaseModel):
    version_id: UUID
    message_id: UUID
    session_id: UUID
    old_content: str
    edited_at: datetime
    responses: List[LogResponse] = []




