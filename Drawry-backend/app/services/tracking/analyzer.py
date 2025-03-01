# app/services/tracking/analyzer.py 생성
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.tracking import EyeTrackingData
from app.core.exceptions import DrawryException
from app.utils.tracking import TrackingUtils

class TrackingAnalyzer:
    def __init__(self, db: Session):
        self.db = db
        self.utils = TrackingUtils()

    async def analyze_reading_session(
        self,
        user_id: int,
        story_id: int,
        session_id: str
    ) -> Dict[str, Any]:
        """특정 세션의 읽기 패턴 분석"""
        try:
            session_data = self.db.query(EyeTrackingData).filter(
                EyeTrackingData.user_id == user_id,
                EyeTrackingData.story_id == story_id,
                EyeTrackingData.tracking_data["session_id"].astext == session_id
            ).first()

            if not session_data:
                raise DrawryException(
                    code="SESSION_NOT_FOUND",
                    message="Reading session not found",
                    status_code=404
                )

            tracking_data = session_data.tracking_data
            return {
                "session_id": session_id,
                "reading_pattern": tracking_data["pattern"],
                "reading_metrics": self._analyze_reading_metrics(tracking_data["metrics"]),
                "attention_map": self._analyze_attention_distribution(tracking_data["heatmap"]),
                "completion_time": tracking_data.get("completed_at")
            }

        except DrawryException:
            raise
        except Exception as e:
            raise DrawryException(
                code="ANALYSIS_ERROR",
                message="Failed to analyze reading session",
                status_code=500,
                details={"error": str(e)}
            )

    async def analyze_user_progress(
        self,
        user_id: int,
        story_id: int,
        time_range: Optional[int] = 30  # 기본 30일
    ) -> Dict[str, Any]:
        """사용자의 읽기 진행도 분석"""
        try:
            start_date = datetime.utcnow() - timedelta(days=time_range)
            
            sessions = self.db.query(EyeTrackingData).filter(
                EyeTrackingData.user_id == user_id,
                EyeTrackingData.story_id == story_id,
                EyeTrackingData.created_at >= start_date
            ).order_by(EyeTrackingData.created_at).all()

            if not sessions:
                return {
                    "total_sessions": 0,
                    "progress_data": {}
                }

            # 진행도 분석
            progress_data = self._analyze_progress_trend(sessions)
            
            # 패턴 변화 분석
            pattern_changes = self._analyze_pattern_changes(sessions)
            
            # 집중도 변화 분석
            attention_trends = self._analyze_attention_trends(sessions)

            return {
                "total_sessions": len(sessions),
                "progress_data": progress_data,
                "pattern_changes": pattern_changes,
                "attention_trends": attention_trends,
                "improvement_suggestions": self._generate_suggestions(progress_data)
            }

        except Exception as e:
            raise DrawryException(
                code="PROGRESS_ANALYSIS_ERROR",
                message="Failed to analyze user progress",
                status_code=500,
                details={"error": str(e)}
            )

    def _analyze_reading_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """읽기 메트릭스 상세 분석"""
        return {
            "reading_speed": self._calculate_reading_speed(metrics),
            "comprehension_estimate": self._estimate_comprehension(metrics),
            "attention_score": metrics.get("attention_score", 0),
            "efficiency_score": self._calculate_efficiency(metrics)
        }

    def _analyze_attention_distribution(self, heatmap: List[List[float]]) -> Dict[str, Any]:
        """주의 집중 분포 분석"""
        import numpy as np
        heatmap_array = np.array(heatmap)
        
        return {
            "focus_areas": self._identify_focus_areas(heatmap_array),
            "attention_density": float(np.mean(heatmap_array)),
            "attention_variance": float(np.var(heatmap_array)),
            "peak_attention_zones": self._find_peak_attention_zones(heatmap_array)
        }

    def _analyze_progress_trend(self, sessions: List[EyeTrackingData]) -> Dict[str, Any]:
        """진행도 추세 분석"""
        trend_data = []
        for session in sessions:
            metrics = session.tracking_data["metrics"]
            trend_data.append({
                "date": session.created_at.isoformat(),
                "reading_speed": self._calculate_reading_speed(metrics),
                "comprehension": self._estimate_comprehension(metrics),
                "attention": metrics.get("attention_score", 0)
            })

        return {
            "trend_data": trend_data,
            "improvement_rate": self._calculate_improvement_rate(trend_data)
        }

    def _analyze_pattern_changes(self, sessions: List[EyeTrackingData]) -> Dict[str, Any]:
        """읽기 패턴 변화 분석"""
        patterns = [s.tracking_data["pattern"] for s in sessions]
        
        return {
            "pattern_distribution": self._calculate_pattern_distribution(patterns),
            "pattern_evolution": self._analyze_pattern_evolution(patterns)
        }

    def _analyze_attention_trends(self, sessions: List[EyeTrackingData]) -> Dict[str, Any]:
        """집중도 변화 추세 분석"""
        attention_scores = [
            s.tracking_data["metrics"].get("attention_score", 0) 
            for s in sessions
        ]
        
        return {
            "average_attention": sum(attention_scores) / len(attention_scores),
            "attention_trend": self._calculate_trend(attention_scores),
            "attention_stability": self._calculate_stability(attention_scores)
        }

    def _generate_suggestions(self, progress_data: Dict[str, Any]) -> List[str]:
        """개선 제안 생성"""
        suggestions = []
        trend_data = progress_data.get("trend_data", [])
        
        if not trend_data:
            return ["충분한 데이터가 없습니다. 더 많은 연습이 필요합니다."]

        # 읽기 속도 관련 제안
        reading_speeds = [d["reading_speed"] for d in trend_data]
        if self._calculate_trend(reading_speeds) < 0:
            suggestions.append("읽기 속도가 감소하는 추세입니다. 속도 향상 연습을 권장합니다.")

        # 이해도 관련 제안
        comprehension_scores = [d["comprehension"] for d in trend_data]
        if sum(comprehension_scores) / len(comprehension_scores) < 0.7:
            suggestions.append("이해도 향상을 위해 천천히 읽기 연습을 해보세요.")

        # 집중도 관련 제안
        attention_scores = [d["attention"] for d in trend_data]
        if self._calculate_stability(attention_scores) < 0.5:
            suggestions.append("집중력이 불안정합니다. 짧은 구간 집중 연습을 추천합니다.")

        return suggestions

    # 유틸리티 메서드들
    def _calculate_reading_speed(self, metrics: Dict[str, Any]) -> float:
        """읽기 속도 계산"""
        total_time = metrics.get("total_time", 0)
        if total_time == 0:
            return 0
        return metrics.get("fixation_count", 0) / total_time

    def _estimate_comprehension(self, metrics: Dict[str, Any]) -> float:
        """이해도 추정"""
        attention_score = metrics.get("attention_score", 0)
        fixation_duration = metrics.get("average_fixation_duration", 0)
        
        # 이해도는 집중도와 평균 고정 시간을 고려하여 추정
        return min(1.0, (attention_score * 0.7 + (fixation_duration / 300) * 0.3))

    def _calculate_efficiency(self, metrics: Dict[str, Any]) -> float:
        """읽기 효율성 계산"""
        speed = self._calculate_reading_speed(metrics)
        comprehension = self._estimate_comprehension(metrics)
        return speed * comprehension

    def _calculate_trend(self, values: List[float]) -> float:
        """추세 계산"""
        if len(values) < 2:
            return 0
        return (values[-1] - values[0]) / len(values)

    def _calculate_stability(self, values: List[float]) -> float:
        """안정성 계산"""
        if not values:
            return 0
        return 1 - (max(values) - min(values)) / max(1, max(values))