from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.lessons import router as lessons_router

app = FastAPI(
    title=settings.app_name,
    description="Backend API for the AI-powered interactive whiteboard tutor.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(lessons_router)


@app.get("/", tags=["system"])
async def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "message": "API is running",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["system"])
async def health() -> dict[str, object]:
    return {
        "status": "healthy",
        "application": "AI Whiteboard Tutor",
        "version": "0.1.0",
        "openai_configured": bool(settings.openai_api_key.strip()),
    }
