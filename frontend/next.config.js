/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['*.trycloudflare.com'],
  transpilePackages: ['@campuscoder/backend'],
};

module.exports = nextConfig;