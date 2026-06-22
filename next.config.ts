import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
};

export default nextConfig;
