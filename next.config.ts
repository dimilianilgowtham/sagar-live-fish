import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Read the Mac's current addresses at startup; hotspot addresses can change.
// Allow only this machine's addresses, without wildcard development origins.
const localDevOrigins = Object.values(networkInterfaces()).flatMap((entries) =>
  (entries ?? [])
    .filter((entry) => !entry.internal && !entry.address.startsWith("fe80:"))
    .map((entry) =>
      entry.family === "IPv6" ? `[${entry.address}]` : entry.address,
    ),
);

const nextConfig: NextConfig = {
  output: "standalone",
  // Runtime data and secrets belong on the private volume, never in an image.
  outputFileTracingExcludes: {
    "/*": ["./.data/**/*", "./.env*", "./release/**/*", "./tests/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
  allowedDevOrigins: ["127.0.0.1", "[::1]", ...localDevOrigins],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
