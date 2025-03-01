# app/schemas/game.py 생성
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class GameStatus(str, Enum):
    STARTED = "started"        # 게임 시작
    IN_PROGRESS = "in_progress"# 진행 중
    COMPLETED = "completed"    # 완료됨
    FAILED = "failed"         # 실패/중단

class GameType(str, Enum):
    READING = "reading"        # 읽기 연습
    WORD_MATCHING = "word_matching"  # 단어 매칭
    SENTENCE_ORDERING = "sentence_ordering"  # 문장 순서

class GameBase(BaseModel):
    story_id: int
    game_type: GameType
    status: GameStatus = GameStatus.STARTED
    score: int = 0
    progress_data: Optional[Dict[str, Any]] = None

class GameCreate(BaseModel):
    game_type: GameType

    @validator('game_type')
    def validate_game_type(cls, v):
        if v not in GameType:
            raise ValueError(f"Invalid game type. Must be one of {[type.value for type in GameType]}")
        return v

class GameUpdate(BaseModel):
    score: Optional[int] = None
    progress_data: Optional[Dict[str, Any]] = None
    status: Optional[GameStatus] = None

    @validator('score')
    def validate_score(cls, v):
        if v is not None and v < 0:
            raise ValueError("Score cannot be negative")
        return v

class GameResponse(GameBase):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GameAnalytics(BaseModel):
    total_games: int
    average_score: float
    completion_rate: float
    time_spent: float
    game_history: list[GameResponse]