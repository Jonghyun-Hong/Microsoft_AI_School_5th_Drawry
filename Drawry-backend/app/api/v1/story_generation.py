# app/api/v1/story_generation.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.story import Story  # Story 모델 import 추가
from app.core.exceptions import DrawryException  # DrawryException import 추가
from app.services.azure.openai import StoryGenerator

router = APIRouter()

@router.post("/generate")
async def generate_story(
    prompt_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """새로운 스토리 생성"""
    generator = StoryGenerator()
    result = await generator.generate_story(prompt_data)
    
    return {
        "status": "success",
        "data": result
    }

@router.post("/modify")
async def modify_story(
    story_id: int,
    modifications: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """기존 스토리 수정"""
    # 스토리 조회
    story = db.query(Story).filter(
        Story.id == story_id,
        Story.user_id == current_user.id
    ).first()
    
    if not story:
        raise DrawryException(
            code="STORY_NOT_FOUND",
            message="Story not found",
            status_code=404
        )
    
    generator = StoryGenerator()
    result = await generator.modify_story(
        original_content=story.content,
        modifications=modifications
    )
    
    return {
        "status": "success",
        "data": result
    }