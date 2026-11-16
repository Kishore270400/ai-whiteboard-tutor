from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.lesson import (
    ErrorResponse,
    LessonGenerateRequest,
    LessonResponse,
)
from app.services.ai_service import AIServiceError, ai_service
from app.services.lesson_store import get_lesson, save_lesson

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.post(
    "/generate",
    response_model=LessonResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
        504: {"model": ErrorResponse},
    },
)
async def generate_lesson(payload: LessonGenerateRequest) -> LessonResponse:
    try:
        generated = ai_service.generate_lesson(payload)
    except AIServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"detail": exc.message, "code": exc.code},
        ) from exc

    lesson = LessonResponse(
        id=str(uuid4()),
        level=payload.level,
        **generated.model_dump(),
    )
    return save_lesson(lesson)


@router.get(
    "/{lesson_id}",
    response_model=LessonResponse,
    responses={404: {"model": ErrorResponse}},
)
async def fetch_lesson(lesson_id: str) -> LessonResponse:
    lesson = get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=404,
            detail={
                "detail": "Lesson not found. Generate a new lesson from the home page.",
                "code": "not_found",
            },
        )
    return lesson
