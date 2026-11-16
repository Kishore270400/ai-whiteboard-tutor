/**
 * Lightweight verification for API base URL / path helpers.
 * Run: node scripts/verify-api-url.mjs
 */

function resolveApiBaseUrl(envValue) {
  const raw = (envValue ?? "").trim();
  if (!raw) return "/api";
  return raw.replace(/\/$/, "");
}

function toApiPath(path) {
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized === "/api") return "/";
  if (normalized.startsWith("/api/")) normalized = normalized.slice(4);
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function joinApiUrl(baseUrl, path) {
  const base = baseUrl.replace(/\/$/, "") || "";
  return `${base}${toApiPath(path)}`;
}

function isLocalhostApiUrl(url) {
  return /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}

const checks = [];

function assert(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
  if (!condition) {
    console.error(`FAIL: ${name}`);
  } else {
    console.log(`PASS: ${name}`);
  }
}

assert("default base is /api", resolveApiBaseUrl(undefined) === "/api");
assert("empty env uses /api", resolveApiBaseUrl("   ") === "/api");
assert("strips trailing slash", resolveApiBaseUrl("http://127.0.0.1:8000/api/") === "http://127.0.0.1:8000/api");
assert("toApiPath health", toApiPath("/health") === "/health");
assert("toApiPath strips /api prefix", toApiPath("/api/health") === "/health");
assert("toApiPath lessons", toApiPath("/api/lessons/generate") === "/lessons/generate");
assert(
  "no /api/api with production base",
  joinApiUrl("/api", "/api/health") === "/api/health",
);
assert(
  "local direct FastAPI URL",
  joinApiUrl("http://127.0.0.1:8000/api", "/health") === "http://127.0.0.1:8000/api/health",
);
assert(
  "production default is not localhost",
  !isLocalhostApiUrl(resolveApiBaseUrl(undefined)),
);
assert(
  "production joined health is not localhost",
  !isLocalhostApiUrl(joinApiUrl(resolveApiBaseUrl(undefined), "/health")),
);

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} API URL checks passed.`);
