from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.dashboard.models import DashboardResponse
from app.database import get_db
from app.dashboard.service import calculate_dashboard_metrics
from app.entities.entities import Dashboard
from datetime import date

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/{user_id}", response_model=DashboardResponse)
def get_user_dashboard(user_id: UUID, db: Session = Depends(get_db)):
    metrics = calculate_dashboard_metrics(db, user_id)

    # Check if dashboard exists
    dashboard = db.query(Dashboard).filter(Dashboard.user_id == user_id).first()

    if dashboard:
        # Update existing dashboard
        dashboard.total_test_plans = metrics["total_test_plans"]
        dashboard.total_commands_generated = metrics["total_commands_generated"]
        dashboard.total_minutes_saved = metrics["total_minutes_saved"]
        dashboard.most_used_device = metrics["most_used_device"]
    else:
        # Create new dashboard
        dashboard = Dashboard(
            user_id=user_id,
            total_test_plans=metrics["total_test_plans"],
            total_commands_generated=metrics["total_commands_generated"],
            total_minutes_saved=metrics["total_minutes_saved"],
            most_used_device=metrics["most_used_device"],
        )
        db.add(dashboard)

    db.commit()
    db.refresh(dashboard)

    return {
    "dashboard_id": dashboard.dashboard_id,
    "user_id": dashboard.user_id,
    "total_test_plans": dashboard.total_test_plans,
    "total_commands_generated": dashboard.total_commands_generated,
    "total_minutes_saved": dashboard.total_minutes_saved,
    "most_used_device": dashboard.most_used_device,
    "month": date.today()
    }

