from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from app.dashboard.models import DashboardResponse, WeeklyTestPlanStat, DashboardCreate
from app.database import get_db
from app.dashboard.service import calculate_dashboard_metrics, get_weekly_stats, create_dashboard
from app.entities.entities import Dashboard
from ..auth.service import CurrentUser
from datetime import date, timedelta

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/", response_model=DashboardResponse)
def get_user_dashboard(current_user: CurrentUser, db: Session = Depends(get_db)):
    user_id = current_user.get_uuid()
    today = date.today()
    monday_this_week = today - timedelta(days=today.weekday())

    # Simulate last 4 weeks
    weekly_stats = [
        WeeklyTestPlanStat(
            week_start=monday_this_week - timedelta(weeks=i),
            test_plans_created=10 - i,
            commands_generated=20 - i * 2,
            reduced_redundancy=5 - i
        )
        for i in range(4)
    ]

    # Calculate total from weekly
    total_reduced_redundancy = sum(stat.reduced_redundancy for stat in weekly_stats)

    dummy_data = {
        "dashboard_id": uuid4(),
        "user_id": user_id,
        "total_test_plans": sum(stat.test_plans_created for stat in weekly_stats),
        "total_commands_generated": sum(stat.commands_generated for stat in weekly_stats),
        "total_reduced_redundancy": sum(stat.reduced_redundancy for stat in weekly_stats),
        "most_used_device": "Keysight 34465A",
        "month": today,
    }

    # Check if user already has a dashboard record for this month
    existing = db.query(Dashboard).filter_by(user_id=user_id, month=today.replace(day=1)).first()
    if not existing:
        create_dashboard(db, DashboardCreate(**dummy_data))

    return {
        **dummy_data,
        "weekly_stats": weekly_stats
    }
