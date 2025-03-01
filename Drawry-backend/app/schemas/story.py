# app/schemas/story.py
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum

class StoryStatus(str, Enum):
    DRAFT = "draft"          # 작성 중
    COMPLETED = "completed"  # 완성됨

class StoryBase(BaseModel):
    title: str
    main_character: str
    status: StoryStatus = StoryStatus.DRAFT

    @validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v) > 100:
            raise ValueError('Title must be less than 100 characters')
        return v.strip()

    @validator('main_character')
    def main_character_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Main character cannot be empty')
        if len(v) > 50:
            raise ValueError('Main character must be less than 50 characters')
        return v.strip()

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    main_character: Optional[str] = None
    status: Optional[StoryStatus] = None

class StoryResponse(StoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True