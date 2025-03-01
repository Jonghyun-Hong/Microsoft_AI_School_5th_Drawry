# app/api/v1/stories.py
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_current_user, get_db, get_story, get_page
from app.models.story import Story
from app.models.page import Page
from app.models.user import User  # User 모델 import 추가
from app.schemas.story import StoryCreate, StoryUpdate, StoryResponse
from app.schemas.page import PageCreate, PageUpdate, PageResponse
from app.core.exceptions import DrawryException

router = APIRouter()

@router.get("", response_model=List[StoryResponse])
async def get_stories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 모든 동화책 목록을 조회합니다."""
    stories = db.query(Story).filter(Story.user_id == current_user.id).all()
    return stories

@router.post("", response_model=StoryResponse)
async def create_story(
    story_data: StoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """새로운 동화책을 생성합니다."""
    story = Story(
        **story_data.dict(),
        user_id=current_user.id
    )
    try:
        db.add(story)
        db.commit()
        db.refresh(story)
        return story
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="CREATE_STORY_ERROR",
            message="Failed to create story",
            status_code=400,
            details={"error": str(e)}
        )

@router.get("/{story_id}", response_model=StoryResponse)
async def get_story_by_id(
    story: Story = Depends(get_story)
):
    """특정 동화책의 상세 정보를 조회합니다."""
    return story

@router.put("/{story_id}", response_model=StoryResponse)
async def update_story(
    story_update: StoryUpdate,
    story: Story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """동화책 정보를 수정합니다."""
    for field, value in story_update.dict(exclude_unset=True).items():
        setattr(story, field, value)
    
    try:
        db.commit()
        db.refresh(story)
        return story
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="UPDATE_STORY_ERROR",
            message="Failed to update story",
            status_code=400,
            details={"error": str(e)}
        )

@router.delete("/{story_id}")
async def delete_story(
    story: Story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """동화책을 삭제합니다."""
    try:
        db.delete(story)
        db.commit()
        return {"message": "Story deleted successfully"}
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="DELETE_STORY_ERROR",
            message="Failed to delete story",
            status_code=400,
            details={"error": str(e)}
        )