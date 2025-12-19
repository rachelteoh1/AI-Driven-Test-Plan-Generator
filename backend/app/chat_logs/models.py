from uuid import UUID
from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

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
    # metadata: Optional[Dict[str, Any]] = None  
    
    # model_config = ConfigDict(from_attributes=True)  # Changed from orm_mode
    
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
    
class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    mistral_status: bool
    llama_status: bool
    device: str
    timestamp: str
    uptime_seconds: Optional[float] = None

class MetricsResponse(BaseModel):
    total_requests: int
    average_response_time: float
    p50_response_time: float
    p90_response_time: float
    p95_response_time: float
    p99_response_time: float
    min_response_time: float
    max_response_time: float
    within_5s_count: int
    within_5s_percentage: float
    sla_met: bool
    timestamp: str

class MetricsEmptyResponse(BaseModel):
    message: str
    count: int
    timestamp: str


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================



class IntentMetadataCreate(BaseModel):
    """Schema for creating intent metadata"""
    message_id: UUID
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)
    scpi_commands: Optional[List[str]] = None
    measurement_types: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    targets: Optional[List[str]] = None
    equipment_refs: Optional[List[str]] = None
    action_verbs: Optional[List[str]] = None
    temporal_info: Optional[List[str]] = None

class IntentMetadataResponse(BaseModel):
    """Schema for returning intent metadata"""
    id: int
    message_id: UUID
    intent: str
    confidence: float
    scpi_commands: Optional[List[str]] = None
    measurement_types: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    targets: Optional[List[str]] = None
    equipment_refs: Optional[List[str]] = None
    action_verbs: Optional[List[str]] = None
    temporal_info: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class IntentStatistics(BaseModel):
    """Schema for intent classification statistics"""
    intent: str
    count: int
    avg_confidence: float
    percentage: float

class IntentAnalytics(BaseModel):
    """Schema for analytics response"""
    period_days: int
    total_queries: int
    statistics: List[IntentStatistics]
    low_confidence_count: int
    
class IntentFeedbackCreate(BaseModel):
    """Schema for submitting intent feedback"""
    message_id: UUID
    was_correct: int = Field(ge=-1, le=1)
    correct_intent: Optional[str] = None
    user_comment: Optional[str] = None

class IntentFeedbackResponse(BaseModel):
    """Schema for returning feedback"""
    id: int
    message_id: UUID
    detected_intent: str
    correct_intent: Optional[str]
    was_correct: int
    user_comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True




