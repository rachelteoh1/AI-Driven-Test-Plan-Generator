from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import date


class WeeklyScpiStat(BaseModel):
    week_start: date
    week_end: date
    scpi_generated: int

class MonthlyScpiStat(BaseModel):
    month_start: date
    scpi_generated: int
    scpi_explained: int
    
class DashboardCreate(BaseModel):
    dashboard_id: UUID
    user_id: UUID
    total_test_plans: int
    total_explanations: int
    total_manuals_uploaded: int
    month: Optional[date]
    
class DashboardResponse(BaseModel):
    dashboard_id: UUID
    user_id: UUID
    total_test_plans: int
    total_explanations: int
    total_manuals_uploaded: int
    month: Optional[date]
    weekly_stats: List[WeeklyScpiStat]
    monthly_stats: List[MonthlyScpiStat]
    
    class Config:
        orm_mode = True