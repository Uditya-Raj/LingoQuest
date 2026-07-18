"""Domain errors and HTTP exception mapping."""
from fastapi import HTTPException, status


class DomainError(Exception):
    """Base class for domain-level errors."""
    
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(DomainError):
    """Resource not found."""
    
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            f"{resource} with id {identifier} not found",
            status.HTTP_404_NOT_FOUND
        )


class ConflictError(DomainError):
    """Resource conflict or invalid state."""
    
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_409_CONFLICT)


class ForbiddenError(DomainError):
    """Forbidden action."""
    
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ValidationError(DomainError):
    """Validation error."""
    
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


def domain_error_to_http_exception(error: DomainError) -> HTTPException:
    """Convert domain error to HTTP exception."""
    return HTTPException(
        status_code=error.status_code,
        detail={"error": error.message}
    )
