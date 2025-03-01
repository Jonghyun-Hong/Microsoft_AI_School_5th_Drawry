# app/api/v1/games.py 생성
from fastapi import APIRouter, Depends, Path, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api.dependencies import get_current_user, get_db, get_story
from app.models.game import GameProgress
from app.models.user import User
from app.schemas.game import (
    GameCreate,
    GameUpdate,
    GameResponse,
    GameAnalytics,
    GameStatus,
    GameType
)
from app.services.game.base import GameService
from app.services.game.eye_tracking import EyeTrackingService
from app.core.exceptions import DrawryException

router = APIRouter()

@router.post("/stories/{story_id}/games/start", response_model=GameResponse)
async def start_game(
    story_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db),
    game_data: GameCreate = None
):
    """새로운 게임 세션을 시작합니다."""
    if game_data is None:
        raise DrawryException(
            code="INVALID_REQUEST",
            message="Game data is required",
            status_code=400
        )

    game_service = GameService(db)
    
    try:
        game = await game_service.create_game(
            user_id=current_user.id,
            story_id=story_id,
            game_type=game_data.game_type
        )
        return game
    except Exception as e:
        raise DrawryException(
            code="GAME_START_ERROR",
            message="Failed to start game",
            status_code=400,
            details={"error": str(e)}
        )

@router.put("/stories/{story_id}/games/{game_id}", response_model=GameResponse)
async def update_game_progress(
    story_id: int = Path(..., gt=0),
    game_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db),
    game_update: GameUpdate = None
):
    """게임 진행 상태를 업데이트합니다."""
    if game_update is None:
        raise DrawryException(
            code="INVALID_REQUEST",
            message="Game update data is required",
            status_code=400
        )

    game_service = GameService(db)
    
    # 게임 소유권 확인
    game = db.query(GameProgress).filter(
        GameProgress.id == game_id,
        GameProgress.user_id == current_user.id,
        GameProgress.story_id == story_id
    ).first()
    
    if not game:
        raise DrawryException(
            code="GAME_NOT_FOUND",
            message="Game not found or access denied",
            status_code=404
        )

    try:
        updated_game = await game_service.update_progress(
            game_id=game_id,
            progress_data=game_update.dict(exclude_unset=True)
        )
        return updated_game
    except Exception as e:
        raise DrawryException(
            code="GAME_UPDATE_ERROR",
            message="Failed to update game progress",
            status_code=400,
            details={"error": str(e)}
        )

@router.post("/stories/{story_id}/games/{game_id}/complete", response_model=GameResponse)
async def complete_game(
    story_id: int = Path(..., gt=0),
    game_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """게임을 완료 처리합니다."""
    game_service = GameService(db)
    
    # 게임 소유권 확인
    game = db.query(GameProgress).filter(
        GameProgress.id == game_id,
        GameProgress.user_id == current_user.id,
        GameProgress.story_id == story_id
    ).first()
    
    if not game:
        raise DrawryException(
            code="GAME_NOT_FOUND",
            message="Game not found or access denied",
            status_code=404
        )

    try:
        completed_game = await game_service.complete_game(game_id)
        return completed_game
    except Exception as e:
        raise DrawryException(
            code="GAME_COMPLETION_ERROR",
            message="Failed to complete game",
            status_code=400,
            details={"error": str(e)}
        )

@router.get("/stories/{story_id}/games", response_model=List[GameResponse])
async def get_game_history(
    story_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """사용자의 게임 기록을 조회합니다."""
    games = db.query(GameProgress).filter(
        GameProgress.user_id == current_user.id,
        GameProgress.story_id == story_id
    ).order_by(GameProgress.created_at.desc()).all()
    
    return games

@router.get("/stories/{story_id}/games/analytics", response_model=Dict[str, Any])
async def get_game_analytics(
    story_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """게임 분석 데이터를 조회합니다."""
    game_service = GameService(db)
    eye_tracking_service = EyeTrackingService(db)
    
    try:
        # 게임 분석 데이터
        game_analytics = await game_service.get_analytics(
            user_id=current_user.id,
            story_id=story_id
        )
        
        # 아이트래킹 분석 데이터
        tracking_analytics = await eye_tracking_service.analyze_tracking_data(
            user_id=current_user.id,
            story_id=story_id
        )
        
        return {
            "game_analytics": game_analytics,
            "tracking_analytics": tracking_analytics
        }
    except Exception as e:
        raise DrawryException(
            code="ANALYTICS_ERROR",
            message="Failed to retrieve analytics",
            status_code=400,
            details={"error": str(e)}
        )