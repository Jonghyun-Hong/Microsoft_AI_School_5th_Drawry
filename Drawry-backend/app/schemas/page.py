# app/schemas/page.py
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class PageBase(BaseModel):
    page_number: int
    content: str
    image_url: Optional[str] = None

    @validator('page_number')
    def valid_page_number(cls, v):
        if v < 1:
            raise ValueError('Page number must be greater than 0')
        return v

    @validator('content')
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None

class PageResponse(PageBase):
    id: int
    story_id: int
    created_at: datetime

    class Config:
        from_attributes = True