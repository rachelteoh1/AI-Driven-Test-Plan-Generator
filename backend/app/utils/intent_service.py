# intent_service.py - Service layer for intent metadata operations

import json
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from uuid import UUID

from ..entities.entities import IntentMetadata, IntentFeedback, ChatLog
from ..chat_logs.models import (
    IntentMetadataCreate, 
    IntentMetadataResponse,
    IntentStatistics,
    IntentAnalytics,
    IntentFeedbackCreate,
    IntentFeedbackResponse
)

logger = logging.getLogger(__name__)


# ============================================================================
# INTENT METADATA CRUD OPERATIONS
# ============================================================================

def create_intent_metadata(
    db: Session,
    metadata_data: IntentMetadataCreate
) -> IntentMetadataResponse:
    """
    Save intent classification metadata to database.
    
    Args:
        db: Database session
        metadata_data: Intent metadata to save
        
    Returns:
        Saved metadata response
    """
    try:
        # Convert lists to JSON strings for storage
        metadata = IntentMetadata(
            message_id=metadata_data.message_id,
            intent=metadata_data.intent,
            confidence=metadata_data.confidence,
            scpi_commands=metadata_data.scpi_commands,
            measurement_types=metadata_data.measurement_types,
            conditions=metadata_data.conditions,
            targets=metadata_data.targets,
            equipment_refs=metadata_data.equipment_refs,
            action_verbs=metadata_data.action_verbs,
            temporal_info=metadata_data.temporal_info
        )
        
        db.add(metadata)
        db.commit()
        db.refresh(metadata)
        
        logger.info(f"Created intent metadata for message {metadata_data.message_id}: {metadata_data.intent}")
        return IntentMetadataResponse.from_orm(metadata)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create intent metadata: {str(e)}")
        raise


def get_intent_metadata(
    db: Session,
    message_id: UUID
) -> Optional[IntentMetadataResponse]:
    """
    Retrieve intent metadata for a specific message.
    
    Args:
        db: Database session
        message_id: Message ID to look up
        
    Returns:
        Intent metadata or None if not found
    """
    metadata = db.query(IntentMetadata).filter(
        IntentMetadata.message_id == message_id
    ).first()
    
    if metadata:
        return IntentMetadataResponse.from_orm(metadata)
    return None


def get_session_intents(
    db: Session,
    session_id: str,
    limit: int = 50
) -> List[IntentMetadataResponse]:
    """
    Get all intent metadata for a session.
    
    Args:
        db: Database session
        session_id: Session identifier
        limit: Maximum number of records to return
        
    Returns:
        List of intent metadata
    """
    results = db.query(IntentMetadata).join(
        ChatLog, IntentMetadata.message_id == ChatLog.message_id
    ).filter(
        ChatLog.session_id == session_id
    ).order_by(
        desc(IntentMetadata.created_at)
    ).limit(limit).all()
    
    return [IntentMetadataResponse.from_orm(m) for m in results]


# ============================================================================
# ANALYTICS FUNCTIONS
# ============================================================================

def get_intent_statistics(
    db: Session,
    days: int = 7
) -> IntentAnalytics:
    """
    Get intent classification statistics for monitoring.
    
    Args:
        db: Database session
        days: Number of days to look back
        
    Returns:
        Intent analytics with distribution and confidence
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get overall stats
    stats = db.query(
        IntentMetadata.intent,
        func.count(IntentMetadata.id).label('count'),
        func.avg(IntentMetadata.confidence).label('avg_confidence')
    ).filter(
        IntentMetadata.created_at >= cutoff_date
    ).group_by(
        IntentMetadata.intent
    ).all()
    
    # Calculate total for percentages
    total_queries = sum(stat.count for stat in stats)
    
    # Get low confidence count
    low_confidence_count = db.query(func.count(IntentMetadata.id)).filter(
        IntentMetadata.created_at >= cutoff_date,
        IntentMetadata.confidence < 0.5
    ).scalar()
    
    # Build statistics list
    statistics = [
        IntentStatistics(
            intent=stat.intent,
            count=stat.count,
            avg_confidence=float(stat.avg_confidence),
            percentage=round((stat.count / total_queries * 100), 2) if total_queries > 0 else 0
        )
        for stat in stats
    ]
    
    # Sort by count descending
    statistics.sort(key=lambda x: x.count, reverse=True)
    
    return IntentAnalytics(
        period_days=days,
        total_queries=total_queries,
        statistics=statistics,
        low_confidence_count=low_confidence_count
    )


def get_low_confidence_intents(
    db: Session,
    threshold: float = 0.5,
    limit: int = 20
) -> List[Dict]:
    """
    Retrieve intents with low confidence for manual review.
    Useful for improving intent classification patterns.
    
    Args:
        db: Database session
        threshold: Confidence threshold (default 0.5)
        limit: Maximum number of records to return
        
    Returns:
        List of low-confidence intents with context
    """
    results = db.query(
        IntentMetadata,
        ChatLog
    ).join(
        ChatLog, IntentMetadata.message_id == ChatLog.message_id
    ).filter(
        IntentMetadata.confidence < threshold
    ).order_by(
        IntentMetadata.confidence.asc()
    ).limit(limit).all()
    
    return [
        {
            "message_id": metadata.message_id,
            "session_id": chat_log.session_id,
            "user_input": chat_log.content if chat_log.role == "user" else None,
            "detected_intent": metadata.intent,
            "confidence": metadata.confidence,
            "scpi_commands": metadata.scpi_commands,
            "measurement_types": metadata.measurement_types,
            "timestamp": metadata.created_at
        }
        for metadata, chat_log in results
    ]


def get_intent_accuracy_metrics(
    db: Session,
    days: int = 30
) -> Dict:
    """
    Calculate intent classification accuracy based on user feedback.
    
    Args:
        db: Database session
        days: Number of days to analyze
        
    Returns:
        Accuracy metrics by intent type
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get feedback stats
    feedback_stats = db.query(
        IntentFeedback.detected_intent,
        func.count(IntentFeedback.id).label('total_feedback'),
        func.sum(func.case((IntentFeedback.was_correct == 1, 1), else_=0)).label('correct_count'),
        func.sum(func.case((IntentFeedback.was_correct == 0, 1), else_=0)).label('incorrect_count')
    ).filter(
        IntentFeedback.created_at >= cutoff_date
    ).group_by(
        IntentFeedback.detected_intent
    ).all()
    
    metrics = []
    for stat in feedback_stats:
        total = stat.total_feedback
        correct = stat.correct_count or 0
        incorrect = stat.incorrect_count or 0
        
        accuracy = (correct / total * 100) if total > 0 else 0
        
        metrics.append({
            "intent": stat.detected_intent,
            "total_feedback": total,
            "correct": correct,
            "incorrect": incorrect,
            "accuracy_percentage": round(accuracy, 2)
        })
    
    return {
        "period_days": days,
        "metrics_by_intent": metrics,
        "overall_accuracy": round(
            sum(m["correct"] for m in metrics) / sum(m["total_feedback"] for m in metrics) * 100, 2
        ) if sum(m["total_feedback"] for m in metrics) > 0 else 0
    }


def get_misclassified_patterns(
    db: Session,
    limit: int = 10
) -> List[Dict]:
    """
    Identify common misclassification patterns for improvement.
    
    Args:
        db: Database session
        limit: Number of patterns to return
        
    Returns:
        List of misclassification patterns
    """
    # Get cases where user provided correction
    misclassified = db.query(
        IntentFeedback.detected_intent,
        IntentFeedback.correct_intent,
        func.count(IntentFeedback.id).label('occurrences')
    ).filter(
        IntentFeedback.was_correct == 0,
        IntentFeedback.correct_intent.isnot(None)
    ).group_by(
        IntentFeedback.detected_intent,
        IntentFeedback.correct_intent
    ).order_by(
        desc('occurrences')
    ).limit(limit).all()
    
    return [
        {
            "detected_as": m.detected_intent,
            "should_be": m.correct_intent,
            "occurrences": m.occurrences
        }
        for m in misclassified
    ]


# ============================================================================
# FEEDBACK OPERATIONS
# ============================================================================

def create_intent_feedback(
    db: Session,
    feedback_data: IntentFeedbackCreate
) -> IntentFeedbackResponse:
    """
    Record user feedback on intent classification.
    
    Args:
        db: Database session
        feedback_data: Feedback information
        
    Returns:
        Saved feedback response
    """
    try:
        # Get the intent metadata for this message
        metadata = db.query(IntentMetadata).filter(
            IntentMetadata.message_id == feedback_data.message_id
        ).first()
        
        if not metadata:
            raise ValueError(f"No intent metadata found for message {feedback_data.message_id}")
        
        feedback = IntentFeedback(
            message_id=feedback_data.message_id,
            intent_metadata_id=metadata.id,
            detected_intent=metadata.intent,
            correct_intent=feedback_data.correct_intent,
            was_correct=feedback_data.was_correct,
            user_comment=feedback_data.user_comment
        )
        
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        logger.info(f"Created intent feedback for message {feedback_data.message_id}: {feedback_data.was_correct}")
        return IntentFeedbackResponse.from_orm(feedback)
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create intent feedback: {str(e)}")
        raise


def get_feedback_by_message(
    db: Session,
    message_id: UUID
) -> Optional[IntentFeedbackResponse]:
    """
    Get feedback for a specific message.
    
    Args:
        db: Database session
        message_id: Message ID
        
    Returns:
        Feedback or None
    """
    feedback = db.query(IntentFeedback).filter(
        IntentFeedback.message_id == message_id
    ).first()
    
    if feedback:
        return IntentFeedbackResponse.from_orm(feedback)
    return None


# ============================================================================
# EXPORT FUNCTIONS
# ============================================================================

def export_training_data(
    db: Session,
    days: int = 30,
    min_confidence: float = 0.7
) -> List[Dict]:
    """
    Export high-confidence intent classifications for training data.
    
    Args:
        db: Database session
        days: Number of days to export
        min_confidence: Minimum confidence threshold
        
    Returns:
        List of training examples
    """
    cutoff_date = datetime.now() - timedelta(days=days)
    
    results = db.query(
        ChatLog.content,
        IntentMetadata.intent,
        IntentMetadata.confidence,
        IntentMetadata.scpi_commands,
        IntentMetadata.measurement_types
    ).join(
        IntentMetadata, ChatLog.message_id == IntentMetadata.message_id
    ).filter(
        ChatLog.role == "user",
        IntentMetadata.created_at >= cutoff_date,
        IntentMetadata.confidence >= min_confidence
    ).all()
    
    return [
        {
            "text": result.content,
            "intent": result.intent,
            "confidence": result.confidence,
            "scpi_commands": result.scpi_commands,
            "measurement_types": result.measurement_types
        }
        for result in results
    ]
    
def save_intent_metadata(
    db: Session,
    message_id: UUID,
    intent: str,
    confidence: float,
    scpi_commands: list,
    measurement_types: list,
    conditions: list,
    targets: list
):
    """
    Save intent classification metadata to database for analytics.
    
    You'll need to create a table like:
    
    CREATE TABLE intent_metadata (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES chat_logs(message_id),
        intent VARCHAR(50),
        confidence FLOAT,
        scpi_commands JSONB,
        measurement_types JSONB,
        conditions JSONB,
        targets JSONB,
        created_at TIMESTAMP DEFAULT NOW()
    );
    """
    try:
        metadata = IntentMetadata(
            message_id=message_id,
            intent=intent,
            confidence=confidence,
            scpi_commands=json.dumps(scpi_commands),
            measurement_types=json.dumps(measurement_types),
            conditions=json.dumps(conditions),
            targets=json.dumps(targets)
        )
        db.add(metadata)
        db.commit()
        logger.info(f"Saved intent metadata for message {message_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save intent metadata: {str(e)}")
        raise
