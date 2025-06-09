from datetime import  datetime
from uuid import  uuid4
from sqlalchemy.orm import Session
from ..entities.entities import ChatSession, ChatLog
import logging
from ..exceptions import (ChatCreationError,ChatError,ChatNotFoundError,ChatRenameError,InternalServerError)
logger = logging.getLogger(__name__)

def create_chat(db: Session, request):
    try:
        new_chat = ChatSession(
            session_id=uuid4(),
            id=request.id,
            title=request.title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        logger.info(f"Chat session created with ID: {new_chat.session_id}")
        return new_chat
    except Exception as e:
        logger.error(f"Failed to create chat session: {str(e)}")
        raise ChatCreationError(str(e))


def rename_chat(db: Session, request):
    chat = db.query(ChatSession).filter_by(session_id=request.session_id).first()
    if not chat:
        logger.warning(f"Chat session not found for rename: {request.session_id}")
        raise ChatNotFoundError(request.session_id)
    try:
        chat.title = request.new_title
        chat.updated_at = datetime.utcnow()
        db.commit()
        logger.info(f"Renamed chat session {request.session_id} to '{request.new_title}'")
        return chat
    except Exception as e:
        logger.error(f"Failed to rename chat session {request.session_id}: {str(e)}")
        raise ChatRenameError(request.session_id)


def delete_chat(db: Session, session_id):
    try:
        deleted_logs = db.query(ChatLog).filter_by(session_id=session_id).delete()
        deleted_session = db.query(ChatSession).filter_by(session_id=session_id).delete()
        db.commit()
        logger.info(f"Deleted chat session {session_id} with {deleted_logs} logs")
    except Exception as e:
        logger.error(f"Failed to delete chat session {session_id}: {str(e)}")
        raise InternalServerError(str(e))


def get_chat_by_user(db: Session, id):
    try:
        chats = db.query(ChatSession).filter_by(id=id).order_by(ChatSession.updated_at.desc()).all()
        logger.info(f"Retrieved {len(chats)} chat sessions for user ID: {id}")
        return chats
    except Exception as e:
        logger.error(f"Failed to get chat sessions for user ID {id}: {str(e)}")
        raise InternalServerError(str(e))
