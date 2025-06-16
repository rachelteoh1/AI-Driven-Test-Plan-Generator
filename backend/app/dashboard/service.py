from sqlalchemy.orm import Session
from ..entities.entities import Dashboard
from .models import DashboardCreate
from uuid import UUID, uuid4
from app.entities.entities import OptimizedTestSequence, ChatLog, ChatSession, ScpiCommand
from datetime import timedelta

def create_dashboard(db: Session, data: DashboardCreate):
    print("📌 Creating dashboard with data:", data.dict())

    # Check if a dashboard already exists for this user
    existing_dashboard = db.query(Dashboard).filter_by(user_id=data.user_id).first()
    if existing_dashboard:
        print("⚠️ Dashboard already exists for this user. Skipping creation.")
        return existing_dashboard  # Or raise an exception if preferred

    dashboard_entry = Dashboard(
        dashboard_id=uuid4(),
        user_id=data.user_id,
        total_test_plans=data.total_test_plans,
        total_commands_generated=data.total_commands_generated,
        total_minutes_saved=data.total_minutes_saved,
        most_used_device=data.most_used_device,
        month=data.month
    )
    db.add(dashboard_entry)
    db.commit()
    db.refresh(dashboard_entry)
    return dashboard_entry

def get_dashboard_by_user(db: Session, user_id: UUID):
    return db.query(Dashboard).filter_by(user_id=user_id).all()

def calculate_dashboard_metrics(db: Session, user_id: UUID):
    total_test_plans = db.query(OptimizedTestSequence) \
                         .join(ChatLog, ChatLog.message_id == OptimizedTestSequence.message_id) \
                         .join(ChatSession, ChatSession.session_id == ChatLog.session_id) \
                         .filter(ChatSession.id == user_id) \
                         .count()

    total_commands_generated = db.query(ScpiCommand) \
                                 .join(OptimizedTestSequence, OptimizedTestSequence.sequence_id == ScpiCommand.sequence_id) \
                                 .join(ChatLog, ChatLog.message_id == OptimizedTestSequence.message_id) \
                                 .join(ChatSession, ChatSession.session_id == ChatLog.session_id) \
                                 .filter(ChatSession.id == user_id) \
                                 .count()

    # Estimate time saved (e.g. assume 0.5 minutes saved per command)
    estimated_saved_minutes = int(total_commands_generated * 0.5)

    # Get most used device — requires a device column in ScpiCommand or a Device table
    most_used_device = "Unknown"  # Placeholder if you haven’t stored device info yet

    return {
        "total_test_plans": total_test_plans,
        "total_commands_generated": total_commands_generated,
        "total_minutes_saved": estimated_saved_minutes,
        "most_used_device": most_used_device,
    }
    
def get_weekly_stats(db: Session, user_id: UUID):
    today = date.today()
    monday_this_week = today - timedelta(days=today.weekday())
    
    stats = []

    for i in range(4):  # Last 4 weeks
        week_start = monday_this_week - timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)

        test_plans = db.query(OptimizedTestSequence) \
            .join(ChatLog, ChatLog.message_id == OptimizedTestSequence.message_id) \
            .join(ChatSession, ChatSession.session_id == ChatLog.session_id) \
            .filter(ChatSession.id == user_id) \
            .filter(OptimizedTestSequence.created_date >= week_start) \
            .filter(OptimizedTestSequence.created_date <= week_end) \
            .all()

        test_plan_count = len(test_plans)

        command_count = db.query(ScpiCommand) \
            .join(OptimizedTestSequence, OptimizedTestSequence.sequence_id == ScpiCommand.sequence_id) \
            .join(ChatLog, ChatLog.message_id == OptimizedTestSequence.message_id) \
            .join(ChatSession, ChatSession.session_id == ChatLog.session_id) \
            .filter(ChatSession.id == user_id) \
            .filter(OptimizedTestSequence.created_date >= week_start) \
            .filter(OptimizedTestSequence.created_date <= week_end) \
            .count()

        stats.append({
            "week_start": week_start,
            "test_plans_created": test_plan_count,
            "commands_generated": command_count,
            "minutes_saved": int(command_count * 0.5)
        })

    return stats