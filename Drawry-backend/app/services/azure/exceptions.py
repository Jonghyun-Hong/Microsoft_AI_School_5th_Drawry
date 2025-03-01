# app/services/azure/exceptions.py
from app.core.exceptions import DrawryException
from typing import Optional, Dict, Any

class AzureSpeechException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="AZURE_SPEECH_ERROR",
            message=message,
            status_code=500,
            details=details
        )

class AzureOpenAIException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="AZURE_OPENAI_ERROR",
            message=message,
            status_code=500,
            details=details
        )

class AzureStorageException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="AZURE_STORAGE_ERROR",
            message=message,
            status_code=500,
            details=details
        )