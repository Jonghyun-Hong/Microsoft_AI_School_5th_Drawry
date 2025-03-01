# app/utils/tracking.py 생성
from typing import List, Dict, Any
import numpy as np
from app.schemas.tracking import GazePoint

class TrackingUtils:
    @staticmethod
    def calculate_fixations(gaze_points: List[GazePoint], threshold: float = 0.1) -> List[Dict[str, Any]]:
        """시선 고정점 계산"""
        fixations = []
        current_points = []
        
        for point in gaze_points:
            if not current_points:
                current_points.append(point)
                continue
                
            # 이전 포인트와의 거리 계산
            prev_point = current_points[-1]
            distance = np.sqrt(
                (point.x - prev_point.x) ** 2 + 
                (point.y - prev_point.y) ** 2
            )
            
            if distance < threshold:
                current_points.append(point)
            else:
                if len(current_points) > 2:  # 최소 고정 포인트 수
                    fixation = {
                        "x": np.mean([p.x for p in current_points]),
                        "y": np.mean([p.y for p in current_points]),
                        "duration": current_points[-1].timestamp - current_points[0].timestamp,
                        "points_count": len(current_points)
                    }
                    fixations.append(fixation)
                current_points = [point]
                
        return fixations

    @staticmethod
    def detect_reading_pattern(fixations: List[Dict[str, Any]]) -> str:
        """읽기 패턴 감지"""
        if not fixations:
            return "unknown"
            
        # y 좌표의 변화 패턴 분석
        y_changes = []
        for i in range(1, len(fixations)):
            y_change = fixations[i]["y"] - fixations[i-1]["y"]
            y_changes.append(y_change)
            
        # 패턴 분석
        if len(y_changes) < 3:
            return "insufficient_data"
            
        vertical_changes = sum(abs(y) > 0.1 for y in y_changes)
        if vertical_changes / len(y_changes) < 0.2:
            return "linear"
        elif vertical_changes / len(y_changes) > 0.5:
            return "scattered"
        else:
            return "mixed"

    @staticmethod
    def calculate_reading_metrics(fixations: List[Dict[str, Any]], total_time: float) -> Dict[str, Any]:
        """읽기 관련 지표 계산"""
        total_fixation_time = sum(f["duration"] for f in fixations)
        
        return {
            "total_time": total_time,
            "fixation_count": len(fixations),
            "average_fixation_duration": total_fixation_time / len(fixations) if fixations else 0,
            "attention_score": total_fixation_time / total_time if total_time > 0 else 0
        }

    @staticmethod
    def generate_heatmap(fixations: List[Dict[str, Any]], resolution: int = 20) -> List[List[float]]:
        """시선 히트맵 생성"""
        heatmap = np.zeros((resolution, resolution))
        
        for fixation in fixations:
            x_idx = min(int(fixation["x"] * resolution), resolution - 1)
            y_idx = min(int(fixation["y"] * resolution), resolution - 1)
            heatmap[y_idx, x_idx] += fixation["duration"]
            
        # 정규화
        if heatmap.max() > 0:
            heatmap = heatmap / heatmap.max()
            
        return heatmap.tolist()