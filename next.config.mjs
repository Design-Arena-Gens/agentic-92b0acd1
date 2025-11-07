/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['date-fns', 'clsx']
  }
};

export default nextConfig;
