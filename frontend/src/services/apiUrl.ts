/**
 * Resolve the Axios base URL for backend API calls.
 * Production default is same-origin "/api" (Vercel multi-service rewrite).
 * Local override example: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
 */
export function resolveApiBaseUrl(
  envValue: string | undefined | null = process.env.NEXT_PUBLIC_API_URL,
): string {
  const raw = (envValue ?? "").trim();
  if (!raw) {
    return "/api";
  }
  return raw.replace(/\/$/, "");
}

/**
 * Convert a logical API path into a path relative to the API base URL.
 * Prevents accidental "/api/api/..." when the base URL already ends with "/api".
 *
 * Examples (base "/api"):
 * - "/health" -> "/health"  => final "/api/health"
 * - "/api/health" -> "/health"
 * - "lessons/generate" -> "/lessons/generate"
 */
export function toApiPath(path: string): string {
  let normalized = path.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized === "/api") {
    return "/";
  }

  if (normalized.startsWith("/api/")) {
    normalized = normalized.slice(4);
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function joinApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, "") || "";
  const relative = toApiPath(path);
  return `${base}${relative}`;
}

export function isLocalhostApiUrl(url: string): boolean {
  return /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}
