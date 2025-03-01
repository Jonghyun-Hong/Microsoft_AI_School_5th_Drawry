# app/services/game/eye_tracking.py 생성
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.tracking import EyeTrackingData
from app.core.exceptions import DrawryException

class EyeTrackingService:
    def __init__(self, db: Session):
        self.db = db

    async def save_tracking_data(
        self,
        user_id: int,
        story_id: int,
        page_id: int,
        tracking_data: Dict[str, Any]
    ) -> EyeTrackingData:
        """아이트래킹 데이터 저장"""
        tracking = EyeTrackingData(
            user_id=user_id,
            story_id=story_id,
            page_id=page_id,
            tracking_data=tracking_data
        )

        try:
            self.db.add(tracking)
            self.db.commit()
            self.db.refresh(tracking)
            return tracking
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="TRACKING_SAVE_ERROR",
                message="Failed to save eye tracking data",
                status_code=400,
                details={"error": str(e)}
            )

    async def analyze_tracking_data(
        self,
        user_id: int,
        story_id: int,
        page_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """아이트래킹 데이터 분석"""
        query = self.db.query(EyeTrackingData).filter(
            EyeTrackingData.user_id == user_id,
            EyeTrackingData.story_id == story_id
        )
        
        if page_id:
            query = query.filter(EyeTrackingData.page_id == page_id)

        tracking_data = query.all()
        
        if not tracking_data:
            return {
                "total_sessions": 0,
                "analysis": {}
            }

        return {
            "total_sessions": len(tracking_data),
            "analysis": self._analyze_reading_patterns(tracking_data)
        }

    def _analyze_reading_patterns(
        self,
        tracking_data: List[EyeTrackingData]
    ) -> Dict[str, Any]:
        """읽기 패턴 분석"""
        total_focus_points = []
        total_reading_time = 0

        for data in tracking_data:
            focus_points = data.tracking_data.get("focus_points", [])
            reading_time = data.tracking_data.get("reading_time", 0)
            
            total_focus_points.extend(focus_points)
            total_reading_time += reading_time

        return {
            "average_reading_time": total_reading_time / len(tracking_data),
            "focus_points_frequency": self._calculate_focus_points_frequency(total_focus_points),
            "reading_pattern_summary": self._summarize_reading_pattern(total_focus_points)
        }

    def _calculate_focus_points_frequency(self, focus_points: List[Dict[str, Any]]) -> Dict[str, int]:
        """포커스 포인트 빈도 계산"""
        frequency = {}
        for point in focus_points:
            area = f"{point.get('x', 0)}-{point.get('y', 0)}"
            frequency[area] = frequency.get(area, 0) + 1
        return frequency

    def _summarize_reading_pattern(self, focus_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """읽기 패턴 요약"""
        if not focus_points:
            return {}

        return {
            "pattern_type": "linear" if self._is_linear_pattern(focus_points) else "scattered",
            "attention_zones": self._identify_attention_zones(focus_points)
        }

    def _is_linear_pattern(self, focus_points: List[Dict[str, Any]]) -> bool:
        """선형 읽기 패턴 여부 확인"""
        if len(focus_points) < 3:
            return True

        prev_y = focus_points[0].get('y', 0)
        y_changes = 0

        for point in focus_points[1:]:
            curr_y = point.get('y', 0)