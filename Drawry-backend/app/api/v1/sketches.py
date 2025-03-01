# app/api/v1/sketches.py 생성
# app/api/v1/sketches.py의 import 부분 수정
from fastapi import APIRouter, Depends, UploadFile, File, Path
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import (
    get_current_user,
    get_db,
    get_page,
    validate_image_file,
    get_azure_storage,
    get_controlnet_service,
    get_prompt_generator
)
from app.models.sketch import Sketch
from app.models.user import User    # 추가
from app.models.page import Page    # 추가
from app.schemas.sketch import SketchCreate, SketchUpdate, SketchResponse
from app.core.exceptions import DrawryException
from app.services.azure.storage import AzureStorageService
from app.services.azure.controlnet import ControlNetService
from app.utils.prompt import PromptGenerator

router = APIRouter()

@router.post("/stories/{story_id}/pages/{page_id}/sketch", response_model=SketchResponse)
async def upload_sketch(
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    file: UploadFile = File(...),
    prompt_data: SketchCreate = Depends(),
    current_user: User = Depends(get_current_user),
    page: Page = Depends(get_page),
    db: Session = Depends(get_db),
    storage_service: AzureStorageService = Depends(get_azure_storage),
    prompt_generator: PromptGenerator = Depends(get_prompt_generator)
):
    """스케치 업로드 및 초기 데이터 생성"""
    # 이미지 파일 검증
    await validate_image_file(file)
    
    # 기존 스케치 확인
    existing_sketch = db.query(Sketch).filter(Sketch.page_id == page_id).first()
    if existing_sketch:
        raise DrawryException(
            code="SKETCH_EXISTS",
            message="Sketch already exists for this page",
            status_code=400
        )

    try:
        # 스케치 이미지 업로드
        sketch_url = await storage_service.upload_sketch(file)
        
        # 프롬프트 생성
        generated_prompt = prompt_generator.generate_prompt(prompt_data.prompt_selections)
        
        # 스케치 데이터 생성
        sketch = Sketch(
            page_id=page_id,
            original_sketch_url=sketch_url,
            generated_image_urls=[],
            prompt_data=generated_prompt
        )
        
        db.add(sketch)
        db.commit()
        db.refresh(sketch)
        
        return sketch
        
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="SKETCH_CREATION_ERROR",
            message="Failed to create sketch",
            status_code=400,
            details={"error": str(e)}
        )

@router.post("/stories/{story_id}/pages/{page_id}/generate", response_model=SketchResponse)
async def generate_images(
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    page: Page = Depends(get_page),
    db: Session = Depends(get_db),
    controlnet_service: ControlNetService = Depends(get_controlnet_service),
    storage_service: AzureStorageService = Depends(get_azure_storage)
):
    """스케치를 기반으로 이미지 생성"""
    sketch = db.query(Sketch).filter(Sketch.page_id == page_id).first()
    if not sketch:
        raise DrawryException(
            code="SKETCH_NOT_FOUND",
            message="Sketch not found",
            status_code=404
        )

    try:
        # ControlNet을 통한 이미지 생성
        generated_urls = await controlnet_service.generate_images(
            sketch_url=sketch.original_sketch_url,
            prompt=sketch.prompt_data["final_prompt"]
        )
        
        # 생성된 이미지 URL 업데이트
        sketch.generated_image_urls = generated_urls
        db.commit()
        db.refresh(sketch)
        
        return sketch
        
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="IMAGE_GENERATION_ERROR",
            message="Failed to generate images",
            status_code=500,
            details={"error": str(e)}
        )

@router.put("/stories/{story_id}/pages/{page_id}/select-image", response_model=SketchResponse)
async def select_image(
    image_data: SketchUpdate,  # 기본값이 없는 매개변수를 앞으로
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    page: Page = Depends(get_page),
    db: Session = Depends(get_db)
):
    """생성된 이미지 중 하나를 선택"""
    sketch = db.query(Sketch).filter(Sketch.page_id == page_id).first()
    if not sketch:
        raise DrawryException(
            code="SKETCH_NOT_FOUND",
            message="Sketch not found",
            status_code=404
        )

    if image_data.selected_image_url not in sketch.generated_image_urls:
        raise DrawryException(
            code="INVALID_IMAGE_URL",
            message="Selected image URL is not in generated images",
            status_code=400
        )

    try:
        sketch.selected_image_url = image_data.selected_image_url
        db.commit()
        db.refresh(sketch)
        
        return sketch
        
    except Exception as e:
        db.rollback()
        raise DrawryException(
            code="IMAGE_SELECTION_ERROR",
            message="Failed to select image",
            status_code=400,
            details={"error": str(e)}
        )