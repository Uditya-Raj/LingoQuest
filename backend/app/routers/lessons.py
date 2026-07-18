"""Lesson attempt start, retrieve, answer, and complete routes."""
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.lesson import (
    LessonAttemptResponse,
    AnswerSubmitRequest,
    AnswerResponse,
    CompletionResponse,
)
from app.services import lesson_engine


router = APIRouter(tags=["lessons"])


@router.post("/skills/{skill_id}/start", response_model=LessonAttemptResponse)
async def start_lesson(
    skill_id: int,
    response: Response,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """
    Start or resume a standard-mode lesson attempt.
    
    Returns 201 Created for new attempts, 200 OK for resumed attempts.
    Blocks locked skills and zero-heart starts with 409 Conflict.
    """
    attempt_response, is_new = await lesson_engine.start_or_resume_standard(
        session, user, skill_id
    )
    
    # Set appropriate status code
    if is_new:
        response.status_code = status.HTTP_201_CREATED
    else:
        response.status_code = status.HTTP_200_OK
    
    return attempt_response


@router.get("/lessons/{attempt_id}", response_model=LessonAttemptResponse, status_code=status.HTTP_200_OK)
async def get_lesson_attempt(
    attempt_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user)
):
    """
    Retrieve a lesson attempt for refresh/direct navigation.
    
    Returns the persisted attempt state including exercise order and current position.
    Unknown or foreign attempts return 404.
    """
    return await lesson_engine.get_attempt(session, user, attempt_id)


@router.post(
    "/lessons/{attempt_id}/answer",
    response_model=AnswerResponse,
    status_code=status.HTTP_200_OK,
)
async def submit_lesson_answer(
    attempt_id: int,
    body: AnswerSubmitRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Submit an answer for the current exercise in an owned in-progress attempt.

    Reveals the correct solution only in this response. Does not award XP.
    """
    return await lesson_engine.submit_answer(
        session,
        user,
        attempt_id,
        body.exercise_id,
        body.position,
        body.answer,
    )


@router.post(
    "/lessons/{attempt_id}/complete",
    response_model=CompletionResponse,
    status_code=status.HTTP_200_OK,
)
async def complete_lesson(
    attempt_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """
    Complete an owned in-progress attempt and apply gamification atomically.

    Awards XP, streak, crowns, unlocks, and achievements exactly once.
    """
    return await lesson_engine.complete_attempt(session, user, attempt_id)
