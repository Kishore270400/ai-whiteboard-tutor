"""Verify public /api route prefixes stay stable for Vercel rewrites."""


def test_health_is_under_api_prefix(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_is_not_under_api_prefix(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_lessons_generate_path_exists_under_api(client, monkeypatch):
    monkeypatch.setattr("app.services.ai_service.settings.openai_api_key", "")
    response = client.post(
        "/api/lessons/generate",
        json={"topic": "Gravity", "level": "beginner", "duration": 120},
    )
    # Missing key should still hit the correct route (not 404).
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "missing_api_key"


def test_no_duplicated_api_api_health_route(client):
    response = client.get("/api/api/health")
    assert response.status_code == 404
