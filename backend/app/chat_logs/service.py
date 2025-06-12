from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..entities.entities import ChatLog, ChatLogVersion
import logging
from ..exceptions import (
    InternalServerError)
from .models import LogCreate, LogResponse
from ..utils.intent_classifier import classify_intent_ml
from ..utils.nlp_utils import preprocess_input
from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError

logger = logging.getLogger(__name__)



def create_chat_log(db: Session, request):
    try:
        new_chat_log = ChatLog(
            message_id=uuid4(),
            session_id=request.session_id,
            role=request.role,
            content=request.content,
            timestamp=datetime.utcnow()
            
        )
        db.add(new_chat_log)
        db.commit()
        db.refresh(new_chat_log)
        logger.info(f"Chat log created for session: {request.session_id}")
        return new_chat_log
    except Exception as e:
        logging.exception(f"Failed to create chat log: {str(e)}")
        raise ChatCreationError(str(e))
    
def deactivate_descendants(db: Session, message_id: UUID):
    to_deactivate = db.query(ChatLog).filter_by(parent_id=message_id, is_active=True).all()
    for msg in to_deactivate:
        msg.is_active = False
        deactivate_descendants(db, msg.message_id)  
    
def modify_chat_log(db: Session, request):
    chat_log = db.query(ChatLog).filter_by(message_id=request.message_id).first()
    if not chat_log:
        raise ChatNotFoundError(request.message_id)
    
    try:
        # Save old version
        version = ChatLogVersion(
            message_id=chat_log.message_id,
            session_id=chat_log.session_id,
            old_content=chat_log.content,
            edited_at=datetime.utcnow()
        )
        db.add(version)
        
        # Deactivate all descendants
        descendants = db.query(ChatLog).filter(
            ChatLog.session_id == chat_log.session_id,
            ChatLog.timestamp > chat_log.timestamp
        ).all()
        
        for msg in descendants:
            msg.is_active = False
        
        # Update current message
        chat_log.content = request.content
        chat_log.timestamp = datetime.utcnow()
        chat_log.has_been_modified = True
        chat_log.is_active = True
        
        llm_request = LogCreate(
            session_id=chat_log.session_id,
            role="llm_response",
            content=chat_log.content
        )
        llm_response = detect_intent(db, llm_request)

        db.commit()
      
        return llm_response
    except Exception as e:
        db.rollback()
        raise ChatRenameError(str(e))

def get_chat_log_versions_with_replies(message_id, db: Session):
    try:
        versions = db.query(ChatLogVersion).filter_by(message_id=message_id).order_by(ChatLogVersion.edited_at).all()
        version_data = []

        for v in versions:
            # Find responses that occurred after this version was edited
            children = db.query(ChatLog).filter(
                ChatLog.session_id == v.session_id,
                ChatLog.timestamp >= v.edited_at,
                ChatLog.is_active == False
            ).order_by(ChatLog.timestamp).all()

            version_data.append({
                "version_id": v.version_id,
                "message_id": v.message_id,
                "session_id": v.session_id,
                "old_content": v.old_content,
                "edited_at": v.edited_at,
                "responses": children
            })

        logger.info(f"Retrieved {len(version_data)} versions for message: {message_id}")
        return version_data  
    except Exception as e:
        logger.error(f"Failed to get previous chat logs for messageid {message_id}: {str(e)}")
        raise InternalServerError(str(e))


def clear_chat_log(db: Session, session_id):
    try:
        deleted = db.query(ChatLog).filter_by(session_id=session_id).delete()
        db.commit()
        logger.info(f"Cleared {deleted} chat logs for session: {session_id}")
    except Exception as e:
        logger.error(f"Failed to clear chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))


def get_chat_log_by_user(db: Session, session_id):
    try:
        logs = db.query(ChatLog).filter_by(session_id=session_id, is_active=True).order_by(ChatLog.timestamp).all()
        logger.info(f"Retrieved {len(logs)} chat logs for session: {session_id}")
        return logs
    except Exception as e:
        logger.error(f"Failed to get chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))

def detect_intent(db: Session, request: LogCreate) -> LogResponse:
    try:
        logger.info(f"Detecting intent for session: {request.session_id}")

        processed_text, scpi_commands ,_, conditions,targets = preprocess_input(request.content)
        intent = classify_intent_ml(processed_text)

        if intent == "unknown":
            response_text = "Sorry, we could not identify your intent, please type in your request again."
        else:
         response_text = (
            f"Intent: {intent}\n"
            f"SCPI Commands: {', '.join(scpi_commands) or 'none'}\n"
            f"Conditions: {', '.join(conditions) or 'none'}\n"
            f"Target: {', '.join(targets) or 'none'}"
         )

        new_log = LogCreate(
            session_id=request.session_id,
            role="llm_response",
            content=response_text,
        )

        saved_log = create_chat_log(db, new_log)
        logger.info(f"Logged LLM response in session {request.session_id}")

        return saved_log

    except Exception as e:
        logger.exception("Intent detection failed")
        raise HTTPException(status_code=500, detail="Failed to detect intent, please enter your request again")