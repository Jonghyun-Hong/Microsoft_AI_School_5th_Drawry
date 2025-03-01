# app/api/v1/speech.py 생성
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.azure.speech import TextToSpeech, SpeechToText
from typing import Dict

router = APIRouter()

@router.post("/tts")
async def text_to_speech(
    text: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """텍스트를 음성으로 변환"""
    tts_service = TextToSpeech()
    audio_url, audio_data = await tts_service.generate_speech(text)
    
    return {
        "status": "success",
        "audio_url": audio_url
    }

@router.post("/stt/file")
async def speech_to_text_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """음성 파일에서 텍스트 추출"""
    stt_service = SpeechToText()
    audio_data = await file.read()
    recognized_text = await stt_service.recognize_from_file(audio_data)
    
    return {
        "status": "success",
        "text": recognized_text
    }

@router.post("/stt/stream")
async def speech_to_text_stream(
    audio_data: bytes,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실시간 음성 스트림에서 텍스트 추출"""
    stt_service = SpeechToText()
    recognized_text = await stt_service.recognize_stream(audio_data)
    
    return {
        "status": "success",
        "text": recognized_text
    }