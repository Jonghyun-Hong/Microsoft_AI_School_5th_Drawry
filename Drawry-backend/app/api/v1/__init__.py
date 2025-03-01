# app/api/v1/__init__.py 수정
from fastapi import APIRouter
from app.api.v1 import (
    auth, users, stories, pages, sketches, 
    games, tracking, speech, story_generation
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(stories.router, prefix="/stories", tags=["stories"])
api_router.include_router(pages.router, prefix="", tags=["pages"])
api_router.include_router(sketches.router, prefix="", tags=["sketches"])
api_router.include_router(games.router, prefix="", tags=["games"])
api_router.include_router(tracking.router, prefix="", tags=["tracking"])
api_router.include_router(speech.router, prefix="/speech", tags=["speech"])
api_router.include_router(story_generation.router, prefix="/story", tags=["story"])