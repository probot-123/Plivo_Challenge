/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    esmExternals: 'loose',
  },
  // Ensure imports from src/ are properly resolved
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig; 