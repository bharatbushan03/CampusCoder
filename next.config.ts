import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
