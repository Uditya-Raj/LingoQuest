"""Authentication and authorization dependencies."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

from app.core.database import get_session
from app.models.user import User
from app.core.errors import NotFoundError


async def get_current_user(session: AsyncSession = Depends(get_session)) -> User:
    """
    Resolve the current authenticated user.
    
    In this simplified demo, we return the seeded default learner (Maya).
    Production authentication would extract user_id from JWT/session.
    """
    # For the assignment demo, use the seeded username
    default_username = "maya_demo"
    
    result = await session.execute(
        select(User).where(User.username == default_username)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise NotFoundError("User", default_username)
    
    return user
