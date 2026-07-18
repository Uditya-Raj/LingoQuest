"""Domain errors and HTTP exception mapping."""
from fastapi import HTTPException, status
from typing import Any


class DomainError(Exception):
    """Base class for domain-level errors."""
    
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundError(DomainError):
    """Resource not found."""
    
    def __init__(self, resource: str, identifier: str | int):
        code = f"{resource.upper().replace(' ', '_')}_NOT_FOUND"
        super().__init__(
            code=code,
            message=f"{resource} with id {identifier} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ConflictError(DomainError):
    """Resource conflict or invalid state."""
    
    def __init__(self, message: str, code: str = "CONFLICT", details: dict[str, Any] | None = None):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class ForbiddenError(DomainError):
    """Forbidden action."""
    
    def __init__(self, message: str, code: str = "FORBIDDEN"):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ValidationError(DomainError):
    """Validation error."""
    
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )


def domain_error_to_http_exception(error: DomainError) -> HTTPException:
    """Convert domain error to HTTP exception with standard error envelope."""
    detail_payload = {
        "error": {
            "code": error.code,
            "message": error.message
        }
    }
    
    if error.details:
        detail_payload["error"]["details"] = error.details
    
    return HTTPException(
        status_code=error.status_code,
        detail=detail_payload
    )
