# app/core/exceptions.py
from typing import Any, Dict, Optional

class DrawryException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

# 인증 관련 예외
class AuthenticationException(DrawryException):
    def __init__(self, code: str, message: str):
        super().__init__(code=code, message=message, status_code=401)

# 권한 관련 예외
class PermissionException(DrawryException):
    def __init__(self, code: str, message: str):
        super().__init__(code=code, message=message, status_code=403)

# 리소스 관련 예외
class ResourceNotFoundException(DrawryException):
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource_type} with id {resource_id} not found",
            status_code=404
        )

# Azure 서비스 관련 예외
class AzureServiceException(DrawryException):
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code=f"{service.upper()}_ERROR",
            message=message,
            status_code=503,
            details=details
        )

# app/core/exceptions.py에 추가
# 기존 예외 클래스들 아래에 추가
class FileUploadException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="FILE_UPLOAD_ERROR",
            message=message,
            status_code=400,
            details=details
        )

class ImageGenerationException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="IMAGE_GENERATION_ERROR",
            message=message,
            status_code=500,
            details=details
        )

class InvalidImageException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="INVALID_IMAGE",
            message=message,
            status_code=400,
            details=details
        )

class InvalidPromptException(DrawryException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="INVALID_PROMPT",
            message=message,
            status_code=400,
            details=details
        )