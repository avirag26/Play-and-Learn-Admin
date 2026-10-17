import type { NextConfig } from "next";

// The Play & Learn API (../play-and-learn-backend). Proxying it under /api keeps the browser on one
// origin, so its httpOnly session cookies are first-party and no CORS is needed.
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
