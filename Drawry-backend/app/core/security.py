# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.exceptions import DrawryException

from app.core.config import settings
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def validate_password(password: str) -> bool:
    """
    비밀번호 정책 검증
    - 최소 8자 이상
    - 최소 1개의 영문자
    - 최소 1개의 숫자
    """
    if len(password) < 8:
        raise DrawryException(
            code="INVALID_PASSWORD",
            message="Password must be at least 8 characters long",
            status_code=400
        )
    
    if not re.search(r"[A-Za-z]", password):
        raise DrawryException(
            code="INVALID_PASSWORD",
            message="Password must contain at least one letter",
            status_code=400
        )
    
    if not re.search(r"\d", password):
        raise DrawryException(
            code="INVALID_PASSWORD",
            message="Password must contain at least one number",
            status_code=400
        )
    
    return True