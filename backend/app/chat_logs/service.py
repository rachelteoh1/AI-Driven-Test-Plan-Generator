from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..entities.entities import ChatLog, ChatLogVersion, SelectedInstrument
import logging
from ..exceptions import (
    InternalServerError)
from .models import LogCreate, LogResponse, InstrumentResponse
from ..utils.intent_classifier import classify_intent_ml
from ..utils.nlp_utils import preprocess_input
from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError
from ..pdf_import.utils.suggest_intent import extract_scpi_from_pdf
from ..instrument import service
import requests
import json
from ..optimized_test_sequence import service as opt_service

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
        
        enhanced_logs = []
        for log in logs:
            # Check if this message has optimization
            has_opt = opt_service.has_optimized_sequence(db, log.message_id) if log.role == "llm_response" else False
            
            # Convert to dict and add has_optimization
            log_dict = {
                "message_id": log.message_id,
                "session_id": log.session_id,
                "role": log.role,
                "content": log.content,
                "timestamp": log.timestamp,
                "has_been_modified": log.has_been_modified,
                "has_optimization": has_opt,
                "parent_id": log.parent_id
            }
            enhanced_logs.append(log_dict)
        
        return enhanced_logs
    except Exception as e:
        logger.error(f"Failed to get chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))


MISTRAL_API_URL = "https://cofinal-semierectly-mignon.ngrok-free.dev/generate"


def detect_intent(db: Session, request: LogCreate) -> LogResponse:
    try:
        logger.info(f"Detecting intent for session: {request.session_id}")
        instruments = service.get_selected_instruments(db, request.session_id)
        if instruments:
            selected_instrument = instruments[-1]
            instrument_prefix = f"Keysight {selected_instrument.model}: "
        else:
            selected_instrument = None
            instrument_prefix = ""

        user_msg = f"{instrument_prefix}{request.content.strip()}"
        logger.info(f"Constructed user message: {user_msg}")

        payload = {
            "prompt": user_msg,
            "max_tokens": 512,
            "temperature": 0.2
        }
        response = requests.post(MISTRAL_API_URL, json=payload, timeout=120)

        if response.status_code != 200:
            logger.error(f"Flask API Error: {response.text}")
            raise Exception(f"Flask API returned {response.status_code}")

        data = response.json()
        logger.info(f"Flask API response: {json.dumps(data, indent=2)}")

        # --- Step 4: Extract response directly from Flask ---
        formatted_output = data.get("response", "")
        opt_sequence = data.get("opt_sequence", "")
        is_explanation = data.get("is_explanation", False)
        
        if not formatted_output:
            raise Exception("Flask API returned empty response")

        logger.info(f"Formatted output length: {len(formatted_output)}")
        logger.info(f"Is explanation: {is_explanation}")
        logger.info(f"Optimized sequence: {opt_sequence}")

        # --- Step 5: Save chat log ---
        new_log = LogCreate(
            session_id=request.session_id,
            role="llm_response",
            content=formatted_output,
        )
        saved_log = create_chat_log(db, new_log)

        # --- Step 6: Save optimized sequence ONLY if NOT explanation ---
        if not is_explanation and opt_sequence and opt_sequence.strip():
            try:
                opt_service.save_optimized_sequence(db, saved_log.message_id, opt_sequence)
                logger.info(f"Saved optimized sequence for message {saved_log.message_id}")
            except Exception as e:
                logger.exception(f"Failed to save optimized sequence: {str(e)}")
        elif is_explanation:
            logger.info(f"Skipping optimization save - this is an explanation response")
        else:
            logger.info(f"Skipping optimization save - empty sequence")

        has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
        # --- Step 7: Build LogResponse object ---
        log_response = LogResponse(
            message_id=saved_log.message_id,
            session_id=saved_log.session_id,
            role=saved_log.role,
            content=saved_log.content,
            timestamp=saved_log.timestamp,
            has_been_modified=saved_log.has_been_modified,
            has_optimization=has_optimization,
            selected_instrument=InstrumentResponse(
                manufacturer=selected_instrument.manufacturer,
                model=selected_instrument.model,
                serial=selected_instrument.serial,
            ) if selected_instrument else None,
        )

        logger.info(f"Returning LogResponse")
        return log_response

    except Exception as e:
        logger.exception("Intent detection failed")
        raise HTTPException(status_code=500, detail=f"Failed to detect intent: {str(e)}")
