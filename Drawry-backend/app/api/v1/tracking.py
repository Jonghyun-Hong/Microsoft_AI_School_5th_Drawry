# app/api/v1/tracking.py 생성
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.api.dependencies import get_current_user, get_db, get_story
from app.models.user import User
from app.schemas.tracking import (
    TrackingData,
    GazePoint,
    TrackingAnalytics
)
from app.services.tracking.collector import TrackingCollector
from app.services.tracking.analyzer import TrackingAnalyzer
from app.core.exceptions import DrawryException

router = APIRouter()

@router.post("/stories/{story_id}/pages/{page_id}/tracking")
async def record_gaze_data(
    gaze_data: GazePoint,  # 기본값이 없는 파라미터를 앞으로
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """실시간 시선 추적 데이터 기록"""
    collector = TrackingCollector(db)
    
    try:
        metrics = await collector.process_gaze_data(
            user_id=current_user.id,
            story_id=story_id,
            page_id=page_id,
            gaze_point=gaze_data
        )
        
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise DrawryException(
            code="TRACKING_RECORD_ERROR",
            message="Failed to record gaze data",
            status_code=500,
            details={"error": str(e)}
        )

@router.post("/stories/{story_id}/pages/{page_id}/tracking/session/complete")
async def complete_tracking_session(
    tracking_data: TrackingData,  # 기본값이 없는 파라미터를 앞으로
    story_id: int = Path(..., gt=0),
    page_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """읽기 세션 완료 및 데이터 저장"""
    collector = TrackingCollector(db)
    analyzer = TrackingAnalyzer(db)
    
    try:
        # 세션 데이터 저장
        session_data = await collector.save_session_data(tracking_data)
        
        # 세션 분석
        analysis = await analyzer.analyze_reading_session(
            user_id=current_user.id,
            story_id=story_id,
            session_id=tracking_data.session_id
        )
        
        return {
            "status": "success",
            "session_data": session_data,
            "analysis": analysis
        }
    except Exception as e:
        raise DrawryException(
            code="SESSION_COMPLETION_ERROR",
            message="Failed to complete tracking session",
            status_code=500,
            details={"error": str(e)}
        )

@router.get("/stories/{story_id}/tracking/analytics")
async def get_tracking_analytics(
    story_id: int = Path(..., gt=0),
    time_range: Optional[int] = Query(30, gt=0, description="분석 기간(일)"),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """읽기 분석 데이터 조회"""
    analyzer = TrackingAnalyzer(db)
    
    try:
        progress_analysis = await analyzer.analyze_user_progress(
            user_id=current_user.id,
            story_id=story_id,
            time_range=time_range
        )
        
        return progress_analysis
    except Exception as e:
        raise DrawryException(
            code="ANALYTICS_ERROR",
            message="Failed to retrieve analytics",
            status_code=500,
            details={"error": str(e)}
        )

@router.get("/stories/{story_id}/tracking/sessions/{session_id}")
async def get_session_analysis(
    story_id: int = Path(..., gt=0),
    session_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    story = Depends(get_story),
    db: Session = Depends(get_db)
):
    """특정 세션의 상세 분석 데이터 조회"""
    analyzer = TrackingAnalyzer(db)
    
    try:
        session_analysis = await analyzer.analyze_reading_session(
            user_id=current_user.id,
            story_id=story_id,
            session_id=session_id
        )
        
        return session_analysis
    except Exception as e:
        raise DrawryException(
            code="SESSION_ANALYSIS_ERROR",
            message="Failed to retrieve session analysis",
            status_code=500,
            details={"error": str(e)}
        )