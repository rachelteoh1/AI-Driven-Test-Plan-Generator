# intent_routes.py - API endpoints for intent metadata and analytics

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from database import get_db
from ..chat_logs.models import (
    IntentMetadataResponse,
    IntentAnalytics,
    IntentFeedbackCreate,
    IntentFeedbackResponse
)
import intent_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/intent", tags=["Intent Analytics"])


# ============================================================================
# INTENT METADATA ENDPOINTS
# ============================================================================

@router.get("/metadata/{message_id}", response_model=IntentMetadataResponse)
def get_message_intent_metadata(
    message_id: int,
    db: Session = Depends(get_db)
):
    """
    Get intent classification metadata for a specific message.
    
    Returns parsed intent, confidence, and extracted entities.
    """
    metadata = intent_service.get_intent_metadata(db, message_id)
    
    if not metadata:
        raise HTTPException(
            status_code=404,
            detail=f"No intent metadata found for message {message_id}"
        )
    
    return metadata


@router.get("/session/{session_id}", response_model=List[IntentMetadataResponse])
def get_session_intent_history(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Get intent classification history for a conversation session.
    
    Useful for understanding conversation flow and context.
    """
    return intent_service.get_session_intents(db, session_id, limit)


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/statistics", response_model=IntentAnalytics)
def get_intent_distribution(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Get intent classification statistics and distribution.
    
    Shows:
    - Intent distribution (count and percentage)
    - Average confidence per intent
    - Low confidence classifications count
    
    Useful for monitoring system performance.
    """
    return intent_service.get_intent_statistics(db, days)


@router.get("/analytics/low-confidence")
def get_low_confidence_classifications(
    threshold: float = Query(0.5, ge=0.0, le=1.0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get intent classifications with low confidence scores.
    
    These are candidates for manual review and can help identify:
    - Ambiguous user inputs
    - Areas where the NLP model needs improvement
    - Patterns that need better classification rules
    """
    return intent_service.get_low_confidence_intents(db, threshold, limit)


@router.get("/analytics/accuracy")
def get_classification_accuracy(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get intent classification accuracy based on user feedback.
    
    Shows how accurate the intent detection is for each intent type.
    Requires user feedback data to be collected.
    """
    return intent_service.get_intent_accuracy_metrics(db, days)


@router.get("/analytics/misclassifications")
def get_misclassification_patterns(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Identify common misclassification patterns.
    
    Shows which intents are frequently confused with each other.
    Useful for improving classification rules and patterns.
    """
    return intent_service.get_misclassified_patterns(db, limit)


@router.get("/analytics/training-data")
def export_training_data(
    days: int = Query(30, ge=1, le=365),
    min_confidence: float = Query(0.7, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Export high-confidence classifications as training data.
    
    Use this to:
    - Create labeled datasets for model fine-tuning
    - Generate test cases
    - Analyze successful classifications
    """
    return intent_service.export_training_data(db, days, min_confidence)


# ============================================================================
# FEEDBACK ENDPOINTS
# ============================================================================

@router.post("/feedback", response_model=IntentFeedbackResponse)
def submit_intent_feedback(
    feedback: IntentFeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Submit user feedback on intent classification accuracy.
    
    Payload:
    {
        "message_id": 123,
        "was_correct": 1,  // 1=correct, 0=incorrect, -1=unsure
        "correct_intent": "generate_test",  // optional: what it should have been
        "user_comment": "Should have been generate not explain"  // optional
    }
    
    This feedback is used to:
    - Monitor classification accuracy
    - Identify improvement areas
    - Train/refine the classification model
    """
    try:
        return intent_service.create_intent_feedback(db, feedback)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Failed to create feedback")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feedback/{message_id}", response_model=IntentFeedbackResponse)
def get_message_feedback(
    message_id: int,
    db: Session = Depends(get_db)
):
    """
    Get feedback for a specific message.
    """
    feedback = intent_service.get_feedback_by_message(db, message_id)
    
    if not feedback:
        raise HTTPException(
            status_code=404,
            detail=f"No feedback found for message {message_id}"
        )
    
    return feedback


# ============================================================================
# DEBUGGING ENDPOINTS
# ============================================================================

@router.post("/debug/classify")
def debug_classify_text(
    text: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to test intent classification without saving.
    
    Useful for:
    - Testing classification rules
    - Experimenting with different inputs
    - Debugging classification issues
    
    Returns the parsed input with all extracted information.
    """
    from nlp_utils import preprocess_input, format_for_llm
    
    try:
        parsed = preprocess_input(text)
        
        return {
            "original_text": parsed.original_text,
            "lemmatized_text": parsed.lemmatized_text,
            "intent": parsed.intent.value,
            "confidence": parsed.confidence,
            "scpi_commands": parsed.scpi_commands,
            "measurement_types": parsed.measurement_types,
            "conditions": parsed.conditions,
            "targets": parsed.targets,
            "equipment_refs": parsed.equipment_refs,
            "action_verbs": parsed.action_verbs,
            "temporal_info": parsed.temporal_info,
            "formatted_for_llm": format_for_llm(parsed)
        }
    except Exception as e:
        logger.exception("Debug classification failed")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
def intent_service_health(db: Session = Depends(get_db)):
    """
    Check health of intent classification service.
    """
    try:
        # Test NLP pipeline
        from nlp_utils import preprocess_input
        test_result = preprocess_input("test voltage measurement")
        
        # Test database
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "nlp_pipeline": "operational",
            "database": "connected",
            "test_classification": {
                "intent": test_result.intent.value,
                "confidence": test_result.confidence
            }
        }
    except Exception as e:
        logger.exception("Health check failed")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# ============================================================================
# ADMIN ENDPOINTS (Optional - add authentication)
# ============================================================================

@router.delete("/admin/clear-old-metadata")
def clear_old_metadata(
    days: int = Query(90, ge=30),
    db: Session = Depends(get_db)
    # Add authentication dependency here
):
    """
    Admin endpoint to clear old intent metadata.
    
    Useful for:
    - Database maintenance
    - GDPR compliance
    - Reducing storage
    
    NOTE: Add proper authentication before using in production!
    """
    from datetime import datetime, timedelta
    from ..entities.entities import IntentMetadata
    
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        
        deleted_count = db.query(IntentMetadata).filter(
            IntentMetadata.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"Deleted {deleted_count} old intent metadata records")
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date
        }
    except Exception as e:
        db.rollback()
        logger.exception("Failed to clear old metadata")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/export-corrections")
def export_user_corrections(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
    # Add authentication dependency here
):
    """
    Admin endpoint to export user corrections for model improvement.
    
    Returns cases where users corrected the intent classification.
    Use this data to improve classification patterns.
    
    NOTE: Add proper authentication before using in production!
    """
    from ..entities.entities import IntentFeedback, IntentMetadata, ChatLog
    
    try:
        corrections = db.query(
            ChatLog.content,
            IntentMetadata.intent,
            IntentFeedback.correct_intent,
            IntentMetadata.confidence,
            IntentFeedback.user_comment
        ).join(
            IntentMetadata, ChatLog.message_id == IntentMetadata.message_id
        ).join(
            IntentFeedback, IntentMetadata.id == IntentFeedback.intent_metadata_id
        ).filter(
            IntentFeedback.was_correct == 0,
            IntentFeedback.correct_intent.isnot(None)
        ).limit(limit).all()
        
        return [
            {
                "user_input": c.content,
                "detected_as": c.intent,
                "should_be": c.correct_intent,
                "confidence": c.confidence,
                "user_comment": c.user_comment
            }
            for c in corrections
        ]
    except Exception as e:
        logger.exception("Failed to export corrections")
        raise HTTPException(status_code=500, detail=str(e))