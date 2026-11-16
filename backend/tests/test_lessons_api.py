from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from openai import AuthenticationError, RateLimitError

from app.schemas.lesson import GeneratedLesson
from app.services.ai_service import AIService, AIServiceError
from app.services.lesson_store import clear_lessons, save_lesson
from app.schemas.lesson import LessonLevel, LessonResponse


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "openai_configured" in body


def test_generate_rejects_empty_topic(client):
    response = client.post(
        "/api/lessons/generate",
        json={"topic": "", "level": "beginner", "duration": 120},
    )
    assert response.status_code == 422


def test_generate_rejects_invalid_duration(client):
    response = client.post(
        "/api/lessons/generate",
        json={"topic": "Newton's Laws", "level": "beginner", "duration": 10},
    )
    assert response.status_code == 422


def test_generate_rejects_invalid_level(client):
    response = client.post(
        "/api/lessons/generate",
        json={"topic": "Newton's Laws", "level": "guru", "duration": 120},
    )
    assert response.status_code == 422


def test_generate_missing_api_key_returns_503(client, monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "")
    response = client.post(
        "/api/lessons/generate",
        json={"topic": "Photosynthesis", "level": "beginner", "duration": 120},
    )
    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail["code"] == "missing_api_key"
    assert "OPENAI_API_KEY" in detail["detail"]


def test_generate_with_mocked_openai_success(client, monkeypatch, sample_lesson_payload):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "sk-test-key")
    monkeypatch.setattr("app.services.ai_service.settings.openai_model", "gpt-4.1-mini")

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=__import__("json").dumps(sample_lesson_payload))
            )
        ]
    )

    with patch("app.services.ai_service.OpenAI", return_value=mock_client):
        response = client.post(
            "/api/lessons/generate",
            json={
                "topic": "Artificial Intelligence",
                "level": "beginner",
                "duration": 120,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["id"]
    assert body["title"] == "Understanding Artificial Intelligence"
    assert body["topic"] == "Artificial Intelligence"
    assert len(body["sections"]) == 4
    assert body["level"] == "beginner"

    stored = client.get(f"/api/lessons/{body['id']}")
    assert stored.status_code == 200
    assert stored.json()["id"] == body["id"]


def test_generate_invalid_ai_json_returns_502(client, monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "sk-test-key")

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content="not-json"))]
    )

    with patch("app.services.ai_service.OpenAI", return_value=mock_client):
        response = client.post(
            "/api/lessons/generate",
            json={"topic": "Photosynthesis", "level": "beginner", "duration": 120},
        )

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "invalid_ai_response"


def test_generate_auth_error_returns_502(client, monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "sk-bad-key")

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = AuthenticationError(
        message="invalid api key",
        response=MagicMock(status_code=401, headers={}),
        body=None,
    )

    with patch("app.services.ai_service.OpenAI", return_value=mock_client):
        response = client.post(
            "/api/lessons/generate",
            json={"topic": "Photosynthesis", "level": "beginner", "duration": 120},
        )

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "openai_auth"


def test_generate_rate_limit_returns_429(client, monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "sk-test-key")

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RateLimitError(
        message="rate limited",
        response=MagicMock(status_code=429, headers={}),
        body=None,
    )

    with patch("app.services.ai_service.OpenAI", return_value=mock_client):
        response = client.post(
            "/api/lessons/generate",
            json={"topic": "Photosynthesis", "level": "advanced", "duration": 180},
        )

    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "openai_rate_limit"


def test_get_unknown_lesson_returns_404(client):
    response = client.get("/api/lessons/does-not-exist")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "not_found"


def test_ai_service_never_returns_hardcoded_lesson_without_openai(monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "")
    service = AIService()
    with pytest.raises(AIServiceError) as exc:
        service.generate_lesson(
            __import__("app.schemas.lesson", fromlist=["LessonGenerateRequest"]).LessonGenerateRequest(
                topic="Gravity",
                level="beginner",
                duration=120,
            )
        )
    assert exc.value.code == "missing_api_key"


def test_store_roundtrip(sample_lesson_payload):
    clear_lessons()
    lesson = LessonResponse(
        id="lesson-123",
        level=LessonLevel.beginner,
        **GeneratedLesson.model_validate(sample_lesson_payload).model_dump(),
    )
    save_lesson(lesson)
    fetched = __import__("app.services.lesson_store", fromlist=["get_lesson"]).get_lesson("lesson-123")
    assert fetched is not None
    assert fetched.title == lesson.title
