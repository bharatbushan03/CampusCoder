/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['*.trycloudflare.com'],
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;