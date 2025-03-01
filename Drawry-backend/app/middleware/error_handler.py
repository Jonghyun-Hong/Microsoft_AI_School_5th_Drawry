# app/middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from azure.core.exceptions import AzureError
from app.core.exceptions import DrawryException
import logging

logger = logging.getLogger(__name__)

async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        return handle_exception(exc)

def handle_exception(exc: Exception) -> JSONResponse:
    if isinstance(exc, DrawryException):
        # 커스텀 예외 처리
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details
                }
            }
        )
    
    elif isinstance(exc, RequestValidationError):
        # 요청 검증 예외 처리
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "INVALID_INPUT",
                    "message": "Invalid input data",
                    "details": {
                        "errors": exc.errors()
                    }
                }
            }
        )
    
    elif isinstance(exc, AzureError):
        # Azure 서비스 예외 처리
        logger.error(f"Azure service error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "AZURE_SERVICE_ERROR",
                    "message": "External service temporarily unavailable",
                    "details": {
                        "service": "azure",
                        "reason": str(exc)
                    }
                }
            }
        )
    
    elif isinstance(exc, SQLAlchemyError):
        # 데이터베이스 예외 처리
        logger.error(f"Database error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Database operation failed"
                }
            }
        )
    
    else:
        # 예상치 못한 예외 처리
        logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred"
                }
            }
        )