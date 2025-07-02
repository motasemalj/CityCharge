import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables will be loaded automatically from .env.local
  experimental: {
    turbo: {
      resolveExtensions: [
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.mjs',
        '.json',
      ],
    },
  },
  // Add transpile packages for workspace modules
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  // Configure webpack as fallback for non-turbo builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-map-gl': require.resolve('react-map-gl'),
        'mapbox-gl': require.resolve('mapbox-gl'),
      };
    }
    return config;
  },
};

export default nextConfig;
