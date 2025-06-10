from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends
from passlib.context import CryptContext
import jwt
import os
from dotenv import load_dotenv
from jwt import PyJWTError
from sqlalchemy.orm import Session
from ..entities.entities import User
from . import models
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from ..exceptions import AuthenticationError
import logging
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return bcrypt_context.hash(password)


def authenticate_user(email, password, db):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # email not found
        raise HTTPException(status_code=404, detail="User not found. Please create an account before sign in.")
    if not verify_password(password, user.password_hash):
        # wrong password
        raise HTTPException(status_code=401, detail="Incorrect password.")
    return user


def create_access_token(email: str, user_id: UUID, expires_delta: timedelta) -> str:
    encode = {
        'sub': email,
        'id': str(user_id),
        'exp': datetime.now(timezone.utc) + expires_delta
    }
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> models.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get('id')
        return models.TokenData(user_id=user_id)
    except PyJWTError as e:
        logging.warning(f"Token verification failed: {str(e)}")
        raise AuthenticationError()
    
def register_user(db: Session, register_user_request: models.RegisterUserRequest):
    try:
        new_user = User(
            id=uuid4(),
            email=register_user_request.email,
            password_hash=get_password_hash(register_user_request.password),
            
            username=None,
            date_joined=datetime.utcnow(),
            role="user",
            pref_darkmode=False,
            pref_autosave=True,
        )
        db.add(new_user)
        db.commit()
        #return new_user

    except IntegrityError:
        db.rollback()
        logging.warning(f"Attempted to register duplicate email: {register_user_request.email}")
        raise HTTPException(
            status_code=409,
            detail="Email is already registered."
        )

    except Exception as e:
        db.rollback()
        logging.error(f"Failed to register user: {register_user_request.email}. Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during registration."
        )
    
    
def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]) -> models.TokenData:
    return verify_token(token)

CurrentUser = Annotated[models.TokenData, Depends(get_current_user)]


def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
                                 db: Session) -> models.Token:
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise AuthenticationError()
    token = create_access_token(user.email, user.id, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return models.Token(access_token=token, token_type='bearer')
