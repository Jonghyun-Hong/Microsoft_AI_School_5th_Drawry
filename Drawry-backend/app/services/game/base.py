# app/services/game/base.py 생성
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.game import GameProgress
from app.schemas.game import GameType, GameStatus
from app.utils.game import GameProgressTracker, GameAnalyzer
from app.core.exceptions import DrawryException

class GameService:
    def __init__(self, db: Session):
        self.db = db

    async def create_game(
        self,
        user_id: int,
        story_id: int,
        game_type: GameType
    ) -> GameProgress:
        """새로운 게임 세션 생성"""
        game = GameProgress(
            user_id=user_id,
            story_id=story_id,
            game_type=game_type.value,
            status=GameStatus.STARTED.value,
            score=0,
            start_time=datetime.utcnow()
        )
        
        try:
            self.db.add(game)
            self.db.commit()
            self.db.refresh(game)
            return game
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="GAME_CREATE_ERROR",
                message="Failed to create new game session",
                status_code=400,
                details={"error": str(e)}
            )

    async def update_progress(
        self,
        game_id: int,
        progress_data: Dict[str, Any]
    ) -> GameProgress:
        """게임 진행 상태 업데이트"""
        game = self.db.query(GameProgress).filter(GameProgress.id == game_id).first()
        if not game:
            raise DrawryException(
                code="GAME_NOT_FOUND",
                message="Game session not found",
                status_code=404
            )

        try:
            # 점수 계산
            score = GameProgressTracker.calculate_score(
                GameType(game.game_type),
                progress_data
            )
            
            # 상태 업데이트
            game.score = score
            game.status = GameStatus.IN_PROGRESS.value
            game.progress_data = progress_data
            
            self.db.commit()
            self.db.refresh(game)
            return game
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="GAME_UPDATE_ERROR",
                message="Failed to update game progress",
                status_code=400,
                details={"error": str(e)}
            )

    async def complete_game(self, game_id: int) -> GameProgress:
        """게임 완료 처리"""
        game = self.db.query(GameProgress).filter(GameProgress.id == game_id).first()
        if not game:
            raise DrawryException(
                code="GAME_NOT_FOUND",
                message="Game session not found",
                status_code=404
            )

        try:
            game.status = GameStatus.COMPLETED.value
            game.end_time = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(game)
            return game
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="GAME_COMPLETE_ERROR",
                message="Failed to complete game",
                status_code=400,
                details={"error": str(e)}
            )

    async def get_analytics(
        self,
        user_id: int,
        story_id: int
    ) -> Dict[str, Any]:
        """게임 분석 데이터 조회"""
        games = self.db.query(GameProgress).filter(
            GameProgress.user_id == user_id,
            GameProgress.story_id == story_id
        ).all()

        analytics = {
            "total_games": len(games),
            "games_by_type": {},
            "overall_progress": {}
        }

        for game_type in GameType:
            type_games = [g for g in games if g.game_type == game_type.value]
            if type_games:
                analytics["games_by_type"][game_type.value] = {
                    "count": len(type_games),
                    "average_score": sum(g.score for g in type_games) / len(type_games),
                    "completed": len([g for g in type_games if g.status == GameStatus.COMPLETED.value])
                }

        return analytics