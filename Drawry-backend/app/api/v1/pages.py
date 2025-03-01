# app/api/v1/pages.py
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_current_user, get_db, get_story, get_page
from app.models.page import Page
from app.models.story import Story  # Story 모델 import 추가

from app.schemas.page import PageCreate, PageUpdate, PageResponse
from app.core.exceptions import DrawryException

router = APIRouter()

@router.get("/stories/{story_id}/pages", response_model=List[PageResponse])
async def get_pages(
    story: Story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """특정 동화책의 모든 페이지를 조회합니다."""
    pages = db.query(Page).filter(Page.story_id == story.id).order_by(Page.page_number).all()
    return pages

@router.post("/stories/{story_id}/pages", response_model=PageResponse)
async def create_page(
    page_data: PageCreate,
    story: Story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """새로운 페이지를 생성합니다."""
    # 페이지 번호 중복 검사
    existing_page = db.query(Page).filter(
        Page.story_id == story.id,
        Page.page_number == page_data.page_number
    ).first()
    
    if existing_page:
        raise DrawryException(
            code="PAGE_NUMBER_EXISTS",
            message=f"Page number {page_data.page_number} already exists in this story",
            status_code=400
        )

    page = Page(
        **page_data.dict(),
        story_id=story.id
    )
    
    try:
        db.add(page)
        db.commit()
        db.refresh(page)
        return page
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="CREATE_PAGE_ERROR",
            message="Failed to create page",
            status_code=400,
            details={"error": str(e)}
        )

@router.get("/stories/{story_id}/pages/{page_id}", response_model=PageResponse)
async def get_page_by_id(
    page: Page = Depends(get_page)
):
    """특정 페이지의 상세 정보를 조회합니다."""
    return page

@router.put("/stories/{story_id}/pages/{page_id}", response_model=PageResponse)
async def update_page(
    page_update: PageUpdate,
    page: Page = Depends(get_page),
    db: Session = Depends(get_db)
):
    """페이지 정보를 수정합니다."""
    for field, value in page_update.dict(exclude_unset=True).items():
        setattr(page, field, value)
    
    try:
        db.commit()
        db.refresh(page)
        return page
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="UPDATE_PAGE_ERROR",
            message="Failed to update page",
            status_code=400,
            details={"error": str(e)}
        )

@router.delete("/stories/{story_id}/pages/{page_id}")
async def delete_page(
    page: Page = Depends(get_page),
    db: Session = Depends(get_db)
):
    """페이지를 삭제합니다."""
    try:
        db.delete(page)
        db.commit()
        return {"message": "Page deleted successfully"}
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="DELETE_PAGE_ERROR",
            message="Failed to delete page",
            status_code=400,
            details={"error": str(e)}
        )