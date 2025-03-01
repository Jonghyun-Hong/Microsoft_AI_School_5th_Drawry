# app/schemas/sketch.py 생성
from pydantic import BaseModel, validator
from typing import Dict, Optional
from datetime import datetime

class PromptSelection(BaseModel):
    question: str
    answer: str
    position: str

class PromptData(BaseModel):
    selections: Dict[str, PromptSelection]
    template: str
    final_prompt: str

class SketchBase(BaseModel):
    page_id: int
    original_sketch_url: Optional[str] = None
    generated_image_urls: Optional[list] = None
    selected_image_url: Optional[str] = None
    prompt_data: Optional[PromptData] = None

class SketchCreate(BaseModel):
    page_id: int
    prompt_selections: Dict[str, Dict[str, str]]

class SketchUpdate(BaseModel):
    selected_image_url: str

class SketchResponse(SketchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True