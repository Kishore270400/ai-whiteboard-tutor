from __future__ import annotations

import json
from typing import Any

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)
from pydantic import ValidationError

from app.config import settings
from app.schemas.lesson import GeneratedLesson, LessonGenerateRequest, LessonLevel


class AIServiceError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _build_prompt(request: LessonGenerateRequest) -> str:
    return f"""
You are an expert instructional designer creating a timed whiteboard tutoring lesson.

Create an educational lesson for:
- Topic: {request.topic}
- Level: {request.level.value}
- Target duration: {request.duration} seconds (about 2 minutes if 120)

Return ONLY valid JSON with this exact shape:
{{
  "title": string,
  "topic": string,
  "duration": number,
  "introduction": string,
  "learning_objectives": [string, string, ...],
  "sections": [
    {{
      "id": "section_1",
      "title": string,
      "narration": string,
      "start_time": number,
      "end_time": number,
      "visual_actions": [
        {{
          "id": "action_1",
          "type": "heading|text|diagram|annotation|highlight|arrow|equation|list|box|label",
          "content": "plain text only, no HTML/SVG/JS",
          "start_time": number,
          "duration": number,
          "position": {{ "x": 0-100, "y": 0-100 }}
        }}
      ]
    }}
  ],
  "summary": string,
  "key_points": [string, string, string],
  "follow_up_questions": [string, string]
}}

Hard requirements:
- Exactly 4 to 6 sections.
- Timestamps must be chronological and cover roughly {request.duration} seconds.
- Every section needs narration and at least one visual action.
- Visual action content must be plain educational text (no HTML, SVG, JavaScript).
- Match the learner level: {request.level.value}.
- Topic field must be "{request.topic}".
- Duration field must be {request.duration}.
""".strip()


def _extract_message_content(response: Any) -> str:
    try:
        content = response.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as exc:
        raise AIServiceError(
            "OpenAI returned an unexpected response shape.",
            code="invalid_ai_response",
        ) from exc

    if not content or not str(content).strip():
        raise AIServiceError(
            "OpenAI returned an empty lesson response.",
            code="invalid_ai_response",
        )
    return str(content)


def _parse_lesson_json(raw: str, request: LessonGenerateRequest) -> GeneratedLesson:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AIServiceError(
            "OpenAI returned invalid JSON for the lesson.",
            code="invalid_ai_response",
        ) from exc

    if not isinstance(payload, dict):
        raise AIServiceError(
            "OpenAI lesson payload must be a JSON object.",
            code="invalid_ai_response",
        )

    # Force request constraints so the response stays aligned with the caller.
    payload["topic"] = request.topic
    payload["duration"] = request.duration

    try:
        return GeneratedLesson.model_validate(payload)
    except ValidationError as exc:
        raise AIServiceError(
            "OpenAI lesson failed schema validation.",
            code="invalid_ai_response",
        ) from exc


class AIService:
    def __init__(self, client: OpenAI | None = None) -> None:
        self._client = client

    def _get_client(self) -> OpenAI:
        if not settings.openai_api_key.strip():
            raise AIServiceError(
                "OpenAI API key is not configured. Add OPENAI_API_KEY to backend/.env.",
                code="missing_api_key",
                status_code=503,
            )

        if self._client is not None:
            return self._client

        return OpenAI(api_key=settings.openai_api_key, timeout=60.0)

    def generate_lesson(self, request: LessonGenerateRequest) -> GeneratedLesson:
        client = self._get_client()

        try:
            response = client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.4,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You generate structured educational whiteboard lessons as JSON only. "
                            "Never include HTML, SVG, JavaScript, or executable markup."
                        ),
                    },
                    {"role": "user", "content": _build_prompt(request)},
                ],
            )
        except AuthenticationError as exc:
            raise AIServiceError(
                "OpenAI authentication failed. Check OPENAI_API_KEY.",
                code="openai_auth",
                status_code=502,
            ) from exc
        except RateLimitError as exc:
            raise AIServiceError(
                "OpenAI rate limit reached. Please try again shortly.",
                code="openai_rate_limit",
                status_code=429,
            ) from exc
        except APITimeoutError as exc:
            raise AIServiceError(
                "OpenAI request timed out. Please try again.",
                code="openai_timeout",
                status_code=504,
            ) from exc
        except APIConnectionError as exc:
            raise AIServiceError(
                "Could not reach OpenAI. Check your network connection.",
                code="openai_error",
                status_code=502,
            ) from exc
        except APIStatusError as exc:
            raise AIServiceError(
                f"OpenAI API error ({exc.status_code}).",
                code="openai_error",
                status_code=502,
            ) from exc
        except Exception as exc:  # noqa: BLE001 - surface unexpected SDK failures safely
            raise AIServiceError(
                "Unexpected error while generating the lesson.",
                code="openai_error",
                status_code=502,
            ) from exc

        raw = _extract_message_content(response)
        return _parse_lesson_json(raw, request)


ai_service = AIService()


def level_from_request(level: LessonLevel) -> LessonLevel:
    return level
