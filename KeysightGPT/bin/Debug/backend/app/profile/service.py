from sqlalchemy.orm import Session
from uuid import UUID
import logging

from ..entities.entities import User
from ..exceptions import UserNotFoundError
from . import models

def get_user_by_id(db: Session, user_id: UUID) -> models.UserProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"User not found with ID: {user_id}")
        raise UserNotFoundError(user_id)
    logging.info(f"Successfully retrieved profile for user ID: {user_id}")
    return user

def update_user_profile(db: Session, user_id: UUID, update: models.UserProfileUpdate) -> models.UserProfileResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"User not found with ID: {user_id}")
        raise UserNotFoundError(user_id)

    # Optional email conflict check
    if update.email and update.email != user.email:
        email_exists = db.query(User).filter(User.email == update.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use.")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    logging.info(f"Updated profile for user ID: {user_id}")
    return user
