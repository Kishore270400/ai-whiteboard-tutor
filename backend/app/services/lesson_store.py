from threading import Lock

from app.schemas.lesson import LessonResponse

_lock = Lock()
_lessons: dict[str, LessonResponse] = {}


def save_lesson(lesson: LessonResponse) -> LessonResponse:
    with _lock:
        _lessons[lesson.id] = lesson
    return lesson


def get_lesson(lesson_id: str) -> LessonResponse | None:
    with _lock:
        return _lessons.get(lesson_id)


def clear_lessons() -> None:
    with _lock:
        _lessons.clear()
