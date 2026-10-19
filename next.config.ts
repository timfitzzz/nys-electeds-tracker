import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Official portraits from the unitedstates/images project (public domain).
    remotePatterns: [{ protocol: "https", hostname: "unitedstates.github.io", pathname: "/images/congress/**" }],
  },
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
