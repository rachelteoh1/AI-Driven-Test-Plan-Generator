from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends
from sqlalchemy.orm import Session
from ..entities.entities import ChatLog
from . import models
import logging
from ..exceptions import (
    InternalServerError)
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def create_chatlog(db: Session, request):
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
        logging.exception("Failed to create chat log")
        raise HTTPException(status_code=500, detail=str(e))


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
        logs = db.query(ChatLog).filter_by(session_id=session_id).order_by(ChatLog.timestamp).all()
        logger.info(f"Retrieved {len(logs)} chat logs for session: {session_id}")
        return logs
    except Exception as e:
        logger.error(f"Failed to get chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))
