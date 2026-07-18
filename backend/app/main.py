"""FastAPI application factory and configuration."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.clock import DebugClock, set_clock
from app.core.errors import DomainError, domain_error_to_http_exception
from app.routers import (
    health,
    course,
    lessons,
    hearts,
    user,
    leaderboard,
    achievements,
    admin,
    debug,
)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="LingoPath API",
        description="Backend API for LingoPath language learning application",
        version="1.0.0",
        docs_url=f"{settings.api_prefix}/docs",
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(course.router, prefix=settings.api_prefix)
    app.include_router(lessons.router, prefix=settings.api_prefix)
    app.include_router(hearts.router, prefix=settings.api_prefix)
    app.include_router(user.router, prefix=settings.api_prefix)
    app.include_router(leaderboard.router, prefix=settings.api_prefix)
    app.include_router(achievements.router, prefix=settings.api_prefix)
    app.include_router(admin.router, prefix=settings.api_prefix)

    # Debug clock routes only when explicitly enabled — absent (404) otherwise.
    if settings.debug_clock_enabled:
        set_clock(DebugClock())
        app.include_router(debug.router, prefix=settings.api_prefix)

    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError):
        """Handle domain errors and convert to HTTP responses."""
        http_exc = domain_error_to_http_exception(exc)
        return JSONResponse(
            status_code=http_exc.status_code,
            content=http_exc.detail,
        )

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
