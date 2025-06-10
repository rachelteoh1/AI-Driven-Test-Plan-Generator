from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import date

class DashboardCreate(BaseModel):
    dashboard_id: UUID
    user_id: UUID
    total_test_plans: int
    total_commands_generated: int
    total_minutes_saved: int
    most_used_device: Optional[str]
    month: Optional[date]
    
class DashboardResponse(BaseModel):
    dashboard_id: UUID
    user_id: UUID
    total_test_plans: int
    total_commands_generated: int
    total_minutes_saved: int
    most_used_device: Optional[str]
    month: Optional[date]

    class Config:
        orm_mode = True 