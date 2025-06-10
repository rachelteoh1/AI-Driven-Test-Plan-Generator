from sqlalchemy.orm import Session
from uuid import UUID
import logging

from ..entities.entities import User
from ..exceptions import UserNotFoundError, InvalidPasswordError, PasswordMismatchError
from ..auth.service import verify_password, get_password_hash
from . import models

def get_user_by_id(db: Session, user_id: UUID) -> models.UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"User not found with ID: {user_id}")
        raise UserNotFoundError(user_id)
    logging.info(f"Successfully retrieved user ID: {user_id}")
    return user

def change_password(db: Session, user_id: UUID, password_change: models.PasswordChange) -> None:
    try:
        user = get_user_by_id(db, user_id)
        
        if not verify_password(password_change.current_password, user.password_hash):
            logging.warning(f"Invalid current password for user ID: {user_id}")
            raise InvalidPasswordError()
        
        if password_change.new_password != password_change.new_password_confirm:
            logging.warning(f"Password mismatch for user ID: {user_id}")
            raise PasswordMismatchError()
        
        user.password_hash = get_password_hash(password_change.new_password)
        db.commit()
        logging.info(f"Password changed successfully for user ID: {user_id}")
    except Exception as e:
        logging.error(f"Password change error for user ID: {user_id}. Error: {str(e)}")
        raise
