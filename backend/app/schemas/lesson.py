from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class LessonLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class VisualActionType(str, Enum):
    heading = "heading"
    text = "text"
    diagram = "diagram"
    annotation = "annotation"
    highlight = "highlight"
    arrow = "arrow"
    equation = "equation"
    list = "list"
    box = "box"
    label = "label"


class Position(BaseModel):
    x: float = Field(ge=0, le=100, description="Percent of whiteboard width")
    y: float = Field(ge=0, le=100, description="Percent of whiteboard height")


class VisualAction(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    type: VisualActionType
    content: str = Field(min_length=1, max_length=500)
    start_time: float = Field(ge=0)
    duration: float = Field(gt=0, le=120)
    position: Position

    @field_validator("content")
    @classmethod
    def reject_unsafe_content(cls, value: str) -> str:
        lowered = value.lower()
        forbidden = ("<script", "</script", "javascript:", "onerror=", "onload=", "<iframe", "<svg")
        if any(token in lowered for token in forbidden):
            raise ValueError("Visual action content must be plain text without HTML/JS/SVG.")
        return value.strip()


class LessonSection(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=200)
    narration: str = Field(min_length=1, max_length=4000)
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)
    visual_actions: list[VisualAction] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def validate_section_timing(self) -> "LessonSection":
        if self.end_time <= self.start_time:
            raise ValueError("Section end_time must be greater than start_time.")
        for action in self.visual_actions:
            if action.start_time < self.start_time or action.start_time >= self.end_time:
                raise ValueError(
                    f"Visual action {action.id} start_time must fall within the section timeline."
                )
        return self


class LessonGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    level: LessonLevel = LessonLevel.beginner
    duration: int = Field(default=120, ge=60, le=300)

    @field_validator("topic")
    @classmethod
    def normalize_topic(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Topic cannot be empty.")
        return cleaned


class GeneratedLesson(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=200)
    duration: int = Field(ge=60, le=300)
    introduction: str = Field(min_length=1, max_length=2000)
    learning_objectives: list[str] = Field(min_length=2, max_length=8)
    sections: list[LessonSection] = Field(min_length=4, max_length=6)
    summary: str = Field(min_length=1, max_length=2000)
    key_points: list[str] = Field(min_length=3, max_length=10)
    follow_up_questions: list[str] = Field(min_length=2, max_length=8)

    @model_validator(mode="after")
    def validate_timeline(self) -> "GeneratedLesson":
        previous_end = -1.0
        for section in self.sections:
            if section.start_time < previous_end:
                raise ValueError("Sections must be chronological and non-overlapping.")
            previous_end = section.end_time

        last_end = self.sections[-1].end_time
        if last_end > self.duration + 15:
            raise ValueError("Lesson timeline exceeds the requested duration.")
        return self


class LessonResponse(GeneratedLesson):
    id: str
    level: LessonLevel


class ErrorResponse(BaseModel):
    detail: str
    code: Literal[
        "missing_api_key",
        "openai_auth",
        "openai_rate_limit",
        "openai_timeout",
        "openai_error",
        "invalid_ai_response",
        "not_found",
        "validation_error",
    ]
