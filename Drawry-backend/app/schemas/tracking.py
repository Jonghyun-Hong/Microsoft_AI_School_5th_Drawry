# app/schemas/tracking.py 생성
from pydantic import BaseModel, validator
from typing import List, Dict, Any, Optional
from datetime import datetime

class GazePoint(BaseModel):
    x: float
    y: float
    timestamp: float
    confidence: Optional[float] = None

    @validator('x', 'y')
    def validate_coordinate(cls, v):
        if not (0 <= v <= 1):
            raise ValueError("Coordinate must be between 0 and 1")
        return v

class ReadingMetrics(BaseModel):
    total_time: float
    fixation_count: int
    saccade_count: int
    regression_count: Optional[int] = None
    average_fixation_duration: Optional[float] = None

class TrackingData(BaseModel):
    story_id: int
    page_id: int
    session_id: str
    gaze_points: List[GazePoint]
    page_info: Dict[str, Any]
    reading_metrics: Optional[ReadingMetrics] = None
    created_at: datetime = datetime.utcnow()

class AnalysisResult(BaseModel):
    reading_pattern: str
    focus_areas: List[Dict[str, Any]]
    reading_speed: float
    comprehension_estimate: Optional[float] = None
    attention_score: float

class TrackingAnalytics(BaseModel):
    total_sessions: int
    total_reading_time: float
    average_reading_speed: float
    reading_patterns: Dict[str, int]
    focus_heat_map: List[Dict[str, Any]]
    progress_over_time: List[Dict[str, Any]]