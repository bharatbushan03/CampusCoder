import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['*.trycloudflare.com'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
