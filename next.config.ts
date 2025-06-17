import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  eslint: {
    // Ignorer ESLint pendant le build
    ignoreDuringBuilds: true,
    
    // Ou configurer des règles spécifiques
    dirs: ['src'] // Only run ESLint on the 'src' directory
  },
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
