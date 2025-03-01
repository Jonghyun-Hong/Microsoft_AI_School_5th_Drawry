# app/services/tracking/collector.py 생성
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.tracking import EyeTrackingData
from app.schemas.tracking import TrackingData, GazePoint
from app.utils.tracking import TrackingUtils
from app.core.exceptions import DrawryException

class TrackingCollector:
    def __init__(self, db: Session):
        self.db = db
        self.utils = TrackingUtils()
        self.buffer_size = 50  # 버퍼 크기 (50개의 포인트마다 처리)
        self.point_buffer: List[GazePoint] = []

    async def process_gaze_data(
        self,
        user_id: int,
        story_id: int,
        page_id: int,
        gaze_point: GazePoint
    ) -> Optional[Dict[str, Any]]:
        """실시간 시선 데이터 처리"""
        try:
            # 버퍼에 데이터 추가
            self.point_buffer.append(gaze_point)
            
            # 버퍼가 가득 차면 처리
            if len(self.point_buffer) >= self.buffer_size:
                metrics = self._process_buffer(user_id, story_id, page_id)
                self.point_buffer = []  # 버퍼 초기화
                return metrics
                
            return None
            
        except Exception as e:
            raise DrawryException(
                code="GAZE_PROCESSING_ERROR",
                message="Failed to process gaze data",
                status_code=500,
                details={"error": str(e)}
            )

    def _process_buffer(
        self,
        user_id: int,
        story_id: int,
        page_id: int
    ) -> Dict[str, Any]:
        """버퍼된 데이터 처리"""
        # 시선 고정점 계산
        fixations = self.utils.calculate_fixations(self.point_buffer)
        
        # 읽기 패턴 감지
        pattern = self.utils.detect_reading_pattern(fixations)
        
        # 시간 계산
        start_time = self.point_buffer[0].timestamp
        end_time = self.point_buffer[-1].timestamp
        total_time = end_time - start_time
        
        # 메트릭스 계산
        metrics = self.utils.calculate_reading_metrics(fixations, total_time)
        
        # 히트맵 생성
        heatmap = self.utils.generate_heatmap(fixations)
        
        # 결과 저장
        tracking_data = {
            "user_id": user_id,
            "story_id": story_id,
            "page_id": page_id,
            "fixations": fixations,
            "pattern": pattern,
            "metrics": metrics,
            "heatmap": heatmap,
            "timestamp": datetime.utcnow()
        }
        
        self._save_tracking_data(tracking_data)
        
        return tracking_data

    def _save_tracking_data(self, data: Dict[str, Any]) -> None:
        """트래킹 데이터 저장"""
        try:
            tracking_record = EyeTrackingData(
                user_id=data["user_id"],
                story_id=data["story_id"],
                page_id=data["page_id"],
                tracking_data={
                    "fixations": data["fixations"],
                    "pattern": data["pattern"],
                    "metrics": data["metrics"],
                    "heatmap": data["heatmap"]
                }
            )
            
            self.db.add(tracking_record)
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="TRACKING_SAVE_ERROR",
                message="Failed to save tracking data",
                status_code=500,
                details={"error": str(e)}
            )

    async def save_session_data(
        self,
        tracking_data: TrackingData
    ) -> Dict[str, Any]:
        """세션 완료 시 최종 데이터 저장"""
        try:
            # 전체 시선 고정점 계산
            fixations = self.utils.calculate_fixations(tracking_data.gaze_points)
            
            # 전체 패턴 분석
            pattern = self.utils.detect_reading_pattern(fixations)
            
            # 전체 시간 계산
            total_time = (
                tracking_data.gaze_points[-1].timestamp - 
                tracking_data.gaze_points[0].timestamp
            )
            
            # 전체 메트릭스 계산
            metrics = self.utils.calculate_reading_metrics(fixations, total_time)
            
            # 전체 히트맵 생성
            heatmap = self.utils.generate_heatmap(fixations)
            
            # 최종 데이터 저장
            session_data = {
                "session_id": tracking_data.session_id,
                "story_id": tracking_data.story_id,
                "page_id": tracking_data.page_id,
                "fixations": fixations,
                "pattern": pattern,
                "metrics": metrics,
                "heatmap": heatmap,
                "page_info": tracking_data.page_info,
                "completed_at": datetime.utcnow()
            }
            
            tracking_record = EyeTrackingData(
                user_id=tracking_data.user_id,
                story_id=tracking_data.story_id,
                page_id=tracking_data.page_id,
                tracking_data=session_data
            )
            
            self.db.add(tracking_record)
            self.db.commit()
            
            return session_data
            
        except Exception as e:
            self.db.rollback()
            raise DrawryException(
                code="SESSION_SAVE_ERROR",
                message="Failed to save session data",
                status_code=500,
                details={"error": str(e)}
            )