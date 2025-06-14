from datetime import datetime
from pydantic import BaseModel
from uuid import UUID
from typing import List

#data validation

class ScpiCommandCreateRequest(BaseModel):
    command_text: str
    order_index: int

class SequenceCreateRequest(BaseModel):
    message_id: UUID   
    commands: List[ScpiCommandCreateRequest]



class ScpiCommandResponse(BaseModel):
    command_id: UUID
    command_text: str
    order_index: int

class SequenceResponse(BaseModel):
    sequence_id: UUID
    message_id: UUID
    created_date: datetime
    commands: List[ScpiCommandResponse]

class OptimizedSequenceResponse(BaseModel):
    sequence_id: UUID
    message_id: UUID
    created_date: datetime
    instrument: str
    explanation: str
    commands: List[ScpiCommandResponse]
