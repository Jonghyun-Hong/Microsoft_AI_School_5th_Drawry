# app/services/azure/speech.py 생성
import azure.cognitiveservices.speech as speechsdk
from azure.storage.blob import BlobServiceClient
import asyncio
import uuid
from datetime import datetime
from typing import Optional, Tuple
from app.core.config import settings
from app.services.azure.exceptions import AzureSpeechException, AzureStorageException

class TextToSpeech:
    def __init__(self):
        # Speech 설정
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )
        self.speech_config.speech_synthesis_language = settings.AZURE_SPEECH_LANGUAGE
        
        # Storage 설정
        self.blob_service_client = BlobServiceClient.from_connection_string(
            settings.AZURE_STORAGE_CONNECTION_STRING
        )
        self.container_client = self.blob_service_client.get_container_client(
            settings.AZURE_STORAGE_CONTAINER_AUDIO
        )

    async def generate_speech(self, text: str) -> Tuple[str, bytes]:
        """텍스트를 음성으로 변환"""
        try:
            # 음성 파일 생성
            audio_output = f"output_{uuid.uuid4()}.wav"
            audio_config = speechsdk.audio.AudioOutputConfig(filename=audio_output)
            
            speech_synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=self.speech_config, 
                audio_config=audio_config
            )
            
            # 비동기로 음성 생성
            result = await asyncio.get_event_loop().run_in_executor(
                None, 
                speech_synthesizer.speak_text_async, 
                text
            )
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                # 생성된 음성 파일 읽기
                with open(audio_output, "rb") as audio_file:
                    audio_data = audio_file.read()
                
                # Blob Storage에 업로드
                blob_name = f"speech_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4()}.wav"
                blob_client = self.container_client.get_blob_client(blob_name)
                blob_client.upload_blob(audio_data)
                
                return blob_client.url, audio_data
            else:
                raise AzureSpeechException(
                    message="Speech synthesis failed",
                    details={"reason": str(result.reason)}
                )
                
        except Exception as e:
            raise AzureSpeechException(
                message="Failed to generate speech",
                details={"error": str(e)}
            )

class SpeechToText:
    def __init__(self):
        self.speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )
        self.speech_config.speech_recognition_language = settings.AZURE_SPEECH_LANGUAGE

    async def recognize_from_file(self, audio_data: bytes) -> str:
        """음성 파일에서 텍스트 추출"""
        try:
            # 임시 파일 생성
            temp_filename = f"temp_{uuid.uuid4()}.wav"
            with open(temp_filename, "wb") as temp_file:
                temp_file.write(audio_data)
            
            # 음성 인식 설정
            audio_input = speechsdk.AudioConfig(filename=temp_filename)
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_input
            )
            
            # 비동기로 음성 인식
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                speech_recognizer.recognize_once_async
            )
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text
            else:
                raise AzureSpeechException(
                    message="Speech recognition failed",
                    details={"reason": str(result.reason)}
                )
                
        except Exception as e:
            raise AzureSpeechException(
                message="Failed to recognize speech",
                details={"error": str(e)}
            )

    async def recognize_stream(self, stream_data: bytes) -> str:
        """실시간 스트림에서 텍스트 추출"""
        try:
            # 스트림 설정
            push_stream = speechsdk.audio.PushAudioInputStream()
            push_stream.write(stream_data)
            push_stream.close()
            
            audio_config = speechsdk.audio.AudioConfig(stream=push_stream)
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )
            
            # 비동기로 음성 인식
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                speech_recognizer.recognize_once_async
            )
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text
            else:
                raise AzureSpeechException(
                    message="Stream recognition failed",
                    details={"reason": str(result.reason)}
                )
                
        except Exception as e:
            raise AzureSpeechException(
                message="Failed to recognize stream",
                details={"error": str(e)}
            )