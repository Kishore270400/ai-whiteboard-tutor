import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.lesson_store import clear_lessons


@pytest.fixture
def client():
    clear_lessons()
    with TestClient(app) as test_client:
        yield test_client
    clear_lessons()


@pytest.fixture
def sample_lesson_payload() -> dict:
    return {
        "title": "Understanding Artificial Intelligence",
        "topic": "Artificial Intelligence",
        "duration": 120,
        "introduction": "This lesson introduces artificial intelligence in clear steps.",
        "learning_objectives": [
            "Define artificial intelligence",
            "Describe how AI processes information",
            "Identify everyday AI examples",
        ],
        "sections": [
            {
                "id": "section_1",
                "title": "Introduction to AI",
                "narration": "Artificial intelligence helps computers perform intelligent tasks.",
                "start_time": 0,
                "end_time": 25,
                "visual_actions": [
                    {
                        "id": "action_1",
                        "type": "heading",
                        "content": "Artificial Intelligence",
                        "start_time": 0,
                        "duration": 3,
                        "position": {"x": 50, "y": 15},
                    },
                    {
                        "id": "action_2",
                        "type": "diagram",
                        "content": "Input → Processing → Output",
                        "start_time": 5,
                        "duration": 8,
                        "position": {"x": 50, "y": 50},
                    },
                ],
            },
            {
                "id": "section_2",
                "title": "How AI Learns",
                "narration": "AI systems learn patterns from data and improve predictions.",
                "start_time": 25,
                "end_time": 55,
                "visual_actions": [
                    {
                        "id": "action_3",
                        "type": "text",
                        "content": "Data → Patterns → Predictions",
                        "start_time": 28,
                        "duration": 6,
                        "position": {"x": 40, "y": 40},
                    }
                ],
            },
            {
                "id": "section_3",
                "title": "Everyday Examples",
                "narration": "Recommendations, voice assistants, and navigation use AI.",
                "start_time": 55,
                "end_time": 85,
                "visual_actions": [
                    {
                        "id": "action_4",
                        "type": "list",
                        "content": "Maps, music, email filters",
                        "start_time": 58,
                        "duration": 7,
                        "position": {"x": 45, "y": 45},
                    }
                ],
            },
            {
                "id": "section_4",
                "title": "Summary",
                "narration": "AI processes information, finds patterns, and supports decisions.",
                "start_time": 85,
                "end_time": 120,
                "visual_actions": [
                    {
                        "id": "action_5",
                        "type": "annotation",
                        "content": "AI supports human decision-making",
                        "start_time": 90,
                        "duration": 5,
                        "position": {"x": 50, "y": 60},
                    }
                ],
            },
        ],
        "summary": "AI enables machines to perform intelligent tasks by learning from data.",
        "key_points": [
            "AI processes information",
            "AI identifies patterns",
            "AI generates predictions",
        ],
        "follow_up_questions": [
            "Where do you already use AI each day?",
            "How is machine learning related to AI?",
        ],
    }
