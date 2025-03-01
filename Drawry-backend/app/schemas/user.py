# app/schemas/user.py
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    nickname: str
    birth_date: date

    @validator('nickname')
    def nickname_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Nickname cannot be empty')
        if len(v) > 30:
            raise ValueError('Nickname must be less than 30 characters')
        return v.strip()

class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    birth_date: Optional[date] = None

    @validator('nickname')
    def nickname_not_empty(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('Nickname cannot be empty')
            if len(v) > 30:
                raise ValueError('Nickname must be less than 30 characters')
            return v.strip()
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True