import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent Next.js from picking a parent lockfile (e.g. C:\package-lock.json)
  // as the workspace root, which can break Vercel/production builds.
  outputFileTracingRoot: path.join(__dirname),

  /**
   * Local-only proxy so the browser can call same-origin "/api/*"
   * while FastAPI runs on 127.0.0.1:8000.
   * On Vercel, root vercel.json multi-service rewrites handle /api/* instead.
   */
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }

    const backend =
      process.env.BACKEND_PROXY_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
