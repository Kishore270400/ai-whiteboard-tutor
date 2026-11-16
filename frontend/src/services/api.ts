import axios, { AxiosError, isAxiosError } from "axios";
import type { ApiErrorBody, Lesson, LessonGenerateRequest } from "@/types/lesson";

export type HealthResponse = {
  status: string;
  application: string;
  version: string;
  openai_configured?: boolean;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

const lessonApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90_000,
  headers: { "Content-Type": "application/json" },
});

export type BackendHealthResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; reason: "network" | "cors" | "timeout" | "unavailable" | "invalid"; message: string };

export class ApiRequestError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function classifyHealthError(error: unknown): BackendHealthResult {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.code === "ECONNABORTED") {
      return {
        ok: false,
        reason: "timeout",
        message: "Backend health check timed out.",
      };
    }

    if (axiosError.response) {
      return {
        ok: false,
        reason: "unavailable",
        message: `Backend returned HTTP ${axiosError.response.status}.`,
      };
    }

    const message = axiosError.message?.toLowerCase() ?? "";
    if (message.includes("cors") || message.includes("access-control")) {
      return {
        ok: false,
        reason: "cors",
        message: "Backend CORS blocked this request.",
      };
    }

    if (
      axiosError.code === "ERR_NETWORK" ||
      message.includes("network error") ||
      message.includes("failed to fetch")
    ) {
      return {
        ok: false,
        reason: "network",
        message: "Cannot reach the backend. Is FastAPI running?",
      };
    }

    return {
      ok: false,
      reason: "unavailable",
      message: axiosError.message || "Backend is unavailable.",
    };
  }

  return {
    ok: false,
    reason: "unavailable",
    message: error instanceof Error ? error.message : "Backend is unavailable.",
  };
}

function extractApiError(error: unknown): ApiRequestError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;

    if (axiosError.code === "ECONNABORTED") {
      return new ApiRequestError("Lesson generation timed out. Please try again.", {
        code: "timeout",
        status: 504,
      });
    }

    if (!axiosError.response) {
      return new ApiRequestError("Cannot reach the backend. Check that FastAPI is running.", {
        code: "network",
      });
    }

    const data = axiosError.response.data;
    const detail = data?.detail;
    let message = "Lesson generation failed.";
    let code: string | undefined = data?.code;

    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object") {
      message = detail.detail || message;
      code = detail.code || code;
    }

    if (code === "missing_api_key") {
      message =
        "OpenAI API key is not configured on the backend. Add OPENAI_API_KEY to backend/.env and restart FastAPI.";
    }

    return new ApiRequestError(message, {
      status: axiosError.response.status,
      code,
    });
  }

  return new ApiRequestError(
    error instanceof Error ? error.message : "Unexpected error while generating the lesson.",
  );
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>("/api/health");
  return response.data;
}

/** Verifies the live FastAPI /api/health response — never fakes connectivity. */
export async function checkBackendHealth(): Promise<BackendHealthResult> {
  try {
    const data = await getHealth();

    if (!data || typeof data !== "object" || data.status !== "healthy") {
      return {
        ok: false,
        reason: "invalid",
        message: "Backend health response was invalid.",
      };
    }

    return { ok: true, data };
  } catch (error) {
    return classifyHealthError(error);
  }
}

export async function generateLesson(payload: LessonGenerateRequest): Promise<Lesson> {
  try {
    const response = await lessonApi.post<Lesson>("/api/lessons/generate", {
      topic: payload.topic.trim(),
      level: payload.level ?? "beginner",
      duration: payload.duration ?? 120,
    });
    return response.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  try {
    const response = await lessonApi.get<Lesson>(`/api/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export default api;
