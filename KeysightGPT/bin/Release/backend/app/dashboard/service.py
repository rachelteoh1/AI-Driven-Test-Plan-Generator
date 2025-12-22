from sqlalchemy.orm import Session
from ..entities.entities import Dashboard, ChatLog, ChatSession, SelectedInstrument, OptimizedTestSequence
from .models import DashboardCreate
from uuid import UUID, uuid4
from datetime import date, datetime, timedelta
import calendar

def create_dashboard(db: Session, data: DashboardCreate):
    print("Creating dashboard with data:", data.dict())

    existing_dashboard = db.query(Dashboard).filter_by(user_id=data.user_id).first()
    if existing_dashboard:
        print("Dashboard already exists for this user. Skipping creation.")
        return existing_dashboard

    dashboard_entry = Dashboard(
        dashboard_id=uuid4(),
        user_id=data.user_id,
        total_test_plans=data.total_test_plans,
        total_explanations=data.total_explanations,
        total_manuals_uploaded=data.total_manuals_uploaded,
        month=data.month
    )
    db.add(dashboard_entry)
    db.commit()
    db.refresh(dashboard_entry)
    return dashboard_entry

def get_dashboard_by_user(db: Session, user_id: UUID):
    return db.query(Dashboard).filter_by(user_id=user_id).all()

def calculate_dashboard_metrics(db: Session, user_id: UUID):
    """Calculate user-specific dashboard metrics based on chat logs and instruments."""
    
    user_sessions = db.query(ChatSession.session_id).filter_by(id=user_id).all()
    session_ids = [s.session_id for s in user_sessions]
    
    total_test_plans = db.query(ChatLog).filter(
        ChatLog.session_id.in_(session_ids),
        ChatLog.role == "llm_response",
        ChatLog.is_active == True,
        ChatLog.content.ilike("Raw Sequence:%")
    ).count()
    
    total_explanations = db.query(ChatLog).filter(
        ChatLog.session_id.in_(session_ids),
        ChatLog.role == "llm_response",
        ChatLog.is_active == True,
        ChatLog.content.ilike("Syntax:%")
    ).count()
    
    total_manuals_uploaded = db.query(SelectedInstrument).filter(
        SelectedInstrument.session_id.in_(session_ids),
        SelectedInstrument.json_url_manual.isnot(None)
    ).distinct(SelectedInstrument.instrument_filename).count()
    
    return {
        "total_test_plans": total_test_plans,
        "total_explanations": total_explanations,
        "total_manuals_uploaded": total_manuals_uploaded,
    }

def get_weekly_scpi_stats(db: Session, user_id: UUID):
    """Get SCPI generated per week for the current month (Week 1-5 of the month)."""
    
    user_sessions = db.query(ChatSession.session_id).filter_by(id=user_id).all()
    session_ids = [s.session_id for s in user_sessions]
    
    today = date.today()
    month_start = today.replace(day=1)
    last_day = calendar.monthrange(today.year, today.month)[1]
    
    stats = []
    
    # Calculate weeks within the month (days 1-7, 8-14, 15-21, 22-28, 29-31)
    for week_num in range(1, 6):
        week_start_day = (week_num - 1) * 7 + 1
        week_end_day = min(week_num * 7, last_day)
        
        # Only include weeks that exist in this month
        if week_start_day > last_day:
            break
        
        week_start_date = month_start.replace(day=week_start_day)
        week_end_date = month_start.replace(day=week_end_day)
        week_end_datetime = datetime(month_start.year, month_start.month, week_end_day, 23, 59, 59)
        
        scpi_generated = db.query(ChatLog).filter(
            ChatLog.session_id.in_(session_ids),
            ChatLog.role == "llm_response",
            ChatLog.is_active == True,
            ChatLog.content.ilike("Raw Sequence:%"),
            ChatLog.timestamp >= week_start_date,
            ChatLog.timestamp <= week_end_datetime
        ).count()
        
        stats.append({
            "week_start": week_start_date,
            "week_end": week_end_date,
            "scpi_generated": scpi_generated,
        })
    
    return stats

def get_monthly_scpi_stats(db: Session, user_id: UUID):
    """Get SCPI explained per month for the last 4 months."""
    
    user_sessions = db.query(ChatSession.session_id).filter_by(id=user_id).all()
    session_ids = [s.session_id for s in user_sessions]
    
    today = date.today()
    stats = []
    
    for i in range(4):
        target_date = today.replace(day=1) - timedelta(days=i * 30)
        month_start = target_date.replace(day=1)
        last_day = calendar.monthrange(target_date.year, target_date.month)[1]
        month_end = target_date.replace(day=last_day)
        month_end_datetime = datetime(target_date.year, target_date.month, last_day, 23, 59, 59)
        
        scpi_generated = db.query(ChatLog).filter(
            ChatLog.session_id.in_(session_ids),
            ChatLog.role == "llm_response",
            ChatLog.is_active == True,
            ChatLog.content.ilike("Raw Sequence:%"),
            ChatLog.timestamp >= month_start,
            ChatLog.timestamp <= month_end_datetime
        ).count()
        
        scpi_explained = db.query(ChatLog).filter(
            ChatLog.session_id.in_(session_ids),
            ChatLog.role == "llm_response",
            ChatLog.is_active == True,
            ChatLog.content.ilike("##%"),
            ChatLog.timestamp >= month_start,
            ChatLog.timestamp <= month_end_datetime
        ).count()
        
        stats.append({
            "month_start": month_start,
            "scpi_generated": scpi_generated,
            "scpi_explained": scpi_explained
        })
    
    return stats