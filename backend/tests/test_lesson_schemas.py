import pytest
from pydantic import ValidationError

from app.schemas.lesson import GeneratedLesson, LessonGenerateRequest, VisualAction


def test_request_rejects_empty_topic():
    with pytest.raises(ValidationError):
        LessonGenerateRequest(topic="   ", level="beginner", duration=120)


def test_request_rejects_short_duration():
    with pytest.raises(ValidationError):
        LessonGenerateRequest(topic="Photosynthesis", duration=30)


def test_request_rejects_invalid_level():
    with pytest.raises(ValidationError):
        LessonGenerateRequest(topic="Photosynthesis", level="expert")  # type: ignore[arg-type]


def test_request_accepts_valid_payload():
    payload = LessonGenerateRequest(
        topic="  Artificial Intelligence  ",
        level="advanced",
        duration=180,
    )
    assert payload.topic == "Artificial Intelligence"
    assert payload.level.value == "advanced"
    assert payload.duration == 180


def test_visual_action_rejects_html_javascript(sample_lesson_payload):
    action = sample_lesson_payload["sections"][0]["visual_actions"][0].copy()
    action["content"] = "<script>alert(1)</script>"
    with pytest.raises(ValidationError):
        VisualAction.model_validate(action)


def test_generated_lesson_validates_sample(sample_lesson_payload):
    lesson = GeneratedLesson.model_validate(sample_lesson_payload)
    assert len(lesson.sections) == 4
    assert lesson.duration == 120
