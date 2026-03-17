
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removing invalid keys (eslint, turbo) causing compilation failures in Next.js 16
  reactStrictMode: true,
};

export default nextConfig;
