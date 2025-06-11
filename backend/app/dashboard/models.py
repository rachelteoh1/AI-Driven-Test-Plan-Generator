from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import date


class WeeklyTestPlanStat(BaseModel):
    week_start: date
    test_plans_created: int
    commands_generated: int
    minutes_saved: int
    
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
    weekly_stats: List[WeeklyTestPlanStat]
    class Config:
        orm_mode = True 
