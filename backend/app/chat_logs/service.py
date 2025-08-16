from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..entities.entities import ChatLog, ChatLogVersion
import logging
from ..exceptions import (
    InternalServerError)
from .models import LogCreate, LogResponse
from ..utils.intent_classifier import classify_intent_ml
from ..utils.nlp_utils import preprocess_input
from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError
from ..pdf_import.utils.suggest_intent import extract_scpi_from_pdf

logger = logging.getLogger(__name__)



def create_chat_log(db: Session, request):
    try:
        previous = (
        db.query(ChatLog)
        .filter_by(session_id=request.session_id, is_active=True)
        .order_by(ChatLog.timestamp.desc())
        .first()
    )   
        parent_id = previous.message_id if previous else None
        new_chat_log = ChatLog(
        message_id=uuid4(),
        session_id=request.session_id,
        role=request.role,
        content=request.content,
        timestamp=datetime.now(timezone.utc),
        parent_id=parent_id
        )
        db.add(new_chat_log)
        db.commit()
        db.refresh(new_chat_log)
        logger.info(f"Chat log created for session: {request.session_id}")
        return new_chat_log
    except Exception as e:
        logging.exception(f"Failed to create chat log: {str(e)}")
        raise ChatCreationError(str(e))
    
def deactivate_descendants(db: Session, message_id: UUID, version_id:UUID):
    to_deactivate = db.query(ChatLog).filter_by(parent_id=message_id, is_active=True).all()
    for msg in to_deactivate:
        msg.is_active = False
        msg.version_of = version_id
        deactivate_descendants(db, msg.message_id,version_id)  
    
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
            edited_at=datetime.now(timezone.utc)
        )
        db.add(version)
        db.flush()
        
        # Deactivate all descendants
        deactivate_descendants(db, chat_log.message_id, version.version_id)
        
        # Update current message
        chat_log.content = request.content
        chat_log.updated_at =datetime.now(timezone.utc)
        chat_log.has_been_modified = True
        db.commit()
        db.refresh(chat_log)
        
        llm_request = LogCreate(
            session_id=chat_log.session_id,
            role="llm_response",
            content=chat_log.content
        )
        llm_response = detect_intent(db, llm_request)
      
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
            children = (
                db.query(ChatLog)
                .filter_by(version_of=v.version_id, is_active=False)
                .order_by(ChatLog.timestamp)
                .all()
            )

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
        lemmatised, scpi_cmds ,conditions,targets = preprocess_input(request.content)
        intent = classify_intent_ml(lemmatised)

        if intent == "unknown":
            response_text = "Sorry, we could not identify your intent, please type in your request again."
            
        elif intent =="generate_scpi":
         response_text = (
            f"Intent: {intent}\n"
            f"SCPI Commands: {', '.join(scpi_cmds) or 'None,please specify the SCPI command if available.'}\n"
            f"Conditions: {', '.join(conditions) or 'None, please specify the confition if available.'}\n"
            f"Target: {', '.join(targets) or 'None, please specify your testing target.'}"
         )

        else:
         response_text = (
            f"Intent: {intent}\n"
            f"SCPI Commands: {', '.join(scpi_cmds) or 'None,please specify the SCPI command.'}\n"
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

