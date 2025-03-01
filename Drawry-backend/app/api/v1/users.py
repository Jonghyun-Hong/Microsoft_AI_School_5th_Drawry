# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.exceptions import DrawryException

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    """현재 로그인한 사용자의 정보를 조회합니다."""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 로그인한 사용자의 정보를 수정합니다."""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="UPDATE_USER_ERROR",
            message="Failed to update user information",
            status_code=400,
            details={"error": str(e)}
        )
    
    return current_user