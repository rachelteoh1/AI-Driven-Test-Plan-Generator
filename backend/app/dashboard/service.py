from sqlalchemy.orm import Session
from ..entities.entities import Dashboard
from .models import DashboardCreate
from uuid import UUID
from app.entities.entities import OptimizedTestSequence, ChatLog, ChatSession, ScpiCommand

def create_dashboard(db: Session, data: DashboardCreate):
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