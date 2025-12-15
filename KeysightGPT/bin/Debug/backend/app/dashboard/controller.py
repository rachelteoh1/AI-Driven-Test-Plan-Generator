from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from app.dashboard.models import DashboardResponse, WeeklyScpiStat, MonthlyScpiStat, DashboardCreate
from app.database import get_db
from app.dashboard.service import calculate_dashboard_metrics, get_weekly_scpi_stats, get_monthly_scpi_stats, create_dashboard
from app.entities.entities import Dashboard
from ..auth.service import CurrentUser
from datetime import date

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/", response_model=DashboardResponse)
def get_user_dashboard(current_user: CurrentUser, db: Session = Depends(get_db)):
    user_id = current_user.get_uuid()
    today = date.today()
    
    metrics = calculate_dashboard_metrics(db, user_id)
    weekly_stats_data = get_weekly_scpi_stats(db, user_id)
    monthly_stats_data = get_monthly_scpi_stats(db, user_id)
    
    weekly_stats = [
        WeeklyScpiStat(
            week_start=stat["week_start"],
            week_end=stat["week_end"],
            scpi_generated=stat["scpi_generated"]
        )
        for stat in weekly_stats_data
    ]
    
    monthly_stats = [
        MonthlyScpiStat(
            month_start=stat["month_start"],
            scpi_generated=stat["scpi_generated"],
            scpi_explained=stat["scpi_explained"]
        )
        for stat in monthly_stats_data
    ]
    
    dashboard_data = {
        "dashboard_id": uuid4(),
        "user_id": user_id,
        "total_test_plans": metrics["total_test_plans"],
        "total_explanations": metrics["total_explanations"],
        "total_manuals_uploaded": metrics["total_manuals_uploaded"],
        "month": today,
    }
    
    existing = db.query(Dashboard).filter_by(user_id=user_id, month=today.replace(day=1)).first()
    if not existing:
        create_dashboard(db, DashboardCreate(**dashboard_data))
    
    return {
        **dashboard_data,
        "weekly_stats": weekly_stats,
        "monthly_stats": monthly_stats
    }