# app/api/dependencies.py
from fastapi import Depends, HTTPException, status, UploadFile, Path
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_token
from app.core.exceptions import ResourceNotFoundException, PermissionException, InvalidImageException

from app.models.user import User
from app.models.story import Story
from app.models.page import Page

from app.services.azure.storage import AzureStorageService
from app.services.azure.controlnet import ControlNetService
from app.utils.prompt import PromptGenerator

from typing import Generator

# OAuth2PasswordBearer 인스턴스 생성
# tokenUrl은 토큰을 발급받는 엔드포인트 경로
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    현재 인증된 사용자를 반환합니다.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user


async def get_story(
    story_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Story:
    """
    동화책을 조회하고 사용자의 접근 권한을 확인합니다.
    """
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise ResourceNotFoundException(resource_type="Story", resource_id=str(story_id))
    
    # 자신의 동화책만 접근 가능
    if story.user_id != current_user.id:
        raise PermissionException(
            code="STORY_ACCESS_DENIED",
            message="You don't have permission to access this story"
        )
    
    return story

async def get_page(
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Page:
    """
    페이지를 조회하고 사용자의 접근 권한을 확인합니다.
    """
    # 먼저 동화책 접근 권한 확인
    story = await get_story(story_id, current_user, db)
    
    page = db.query(Page).filter(
        Page.id == page_id,
        Page.story_id == story_id
    ).first()
    
    if not page:
        raise ResourceNotFoundException(resource_type="Page", resource_id=str(page_id))
    
    return page


def get_azure_storage() -> AzureStorageService:
    return AzureStorageService()

def get_controlnet_service() -> ControlNetService:
    return ControlNetService()

def get_prompt_generator() -> PromptGenerator:
    return PromptGenerator()

async def validate_image_file(file: UploadFile):
    """이미지 파일 유효성 검사"""
    # 허용된 이미지 형식
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
    
    # 파일 확장자 검사
    file_ext = f".{file.filename.split('.')[-1].lower()}" if '.' in file.filename else ''
    if file_ext not in ALLOWED_EXTENSIONS:
        raise InvalidImageException(
            message="Invalid file type",
            details={"allowed_extensions": list(ALLOWED_EXTENSIONS)}
        )
    
    # 파일 크기 검사 (10MB 제한)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes
    content = await file.read()
    await file.seek(0)  # 파일 포인터 리셋
    
    if len(content) > MAX_FILE_SIZE:
        raise InvalidImageException(
            message="File size too large",
            details={"max_size_mb": MAX_FILE_SIZE / 1024 / 1024}
        )

    return True