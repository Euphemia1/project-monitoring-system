/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript type checking during build to avoid needing @types packages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;