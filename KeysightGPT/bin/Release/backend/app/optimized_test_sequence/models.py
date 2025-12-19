from datetime import datetime
from pydantic import BaseModel
from uuid import UUID
from typing import List

# Request model for creating optimized sequences
class OptimizedScpiCreateRequest(BaseModel):
    message_id: UUID
    optimized_scpi: str
    order_sequence: int
    type: str

class BulkOptimizedScpiCreateRequest(BaseModel):
    message_id: UUID
    scpi_commands: List[str]

# Response model
class OptimizedScpiResponse(BaseModel):
    id: UUID
    message_id: UUID
    optimized_scpi: str
    order_sequence: int
    type: str
    created_at: datetime

class OptimizedSequenceListResponse(BaseModel):
    message_id: UUID
    commands: List[OptimizedScpiResponse]