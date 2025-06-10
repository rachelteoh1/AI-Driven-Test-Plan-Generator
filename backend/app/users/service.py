from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta
import logging
import os
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException
from ..entities.entities import User
from ..exceptions import UserNotFoundError, InvalidPasswordError, PasswordMismatchError
from ..auth.service import verify_password, get_password_hash
from . import models
from dotenv import load_dotenv
import json
load_dotenv()

EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID")
EMAILJS_TEMPLATE_ID = os.getenv("EMAILJS_TEMPLATE_ID")
EMAILJS_PUBLIC_KEY = os.getenv("EMAILJS_PUBLIC_KEY")

RESET_SECRET_KEY = os.getenv("RESET_SECRET_KEY", "fallback_reset_key")  # fallback for dev
RESET_TOKEN_EXPIRY_MINUTES = 30
ALGORITHM = "HS256"

def get_user_by_id(db: Session, user_id: UUID) -> models.UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logging.warning(f"User not found with ID: {user_id}")
        raise UserNotFoundError(user_id)
    logging.info(f"Successfully retrieved user ID: {user_id}")
    return user

def create_reset_token(user_id: UUID) -> str:
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(payload, RESET_SECRET_KEY, algorithm=ALGORITHM)


def handle_reset_request(db: Session, request: models.PasswordResetRequest):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered.")

    token = create_reset_token(user.id)
    reset_link = f"http://localhost:3000/confirmpw?token={token}"

    logging.info(f"Generated reset link for {user.email}: {reset_link}")
    return {"reset_link": reset_link}



def reset_password_confirm(db: Session, reset_data: models.PasswordResetConfirm):
    if reset_data.new_password != reset_data.confirm_password:
        raise PasswordMismatchError()

    try:
        payload = jwt.decode(reset_data.token, RESET_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = UUID(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UserNotFoundError(user_id)

    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    logging.info(f"Password reset successful for user ID: {user_id}")
