/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Fix: Removed invalid experimental keys to satisfy Next.js 16 build constraints and ensure Turbopack stability */
  reactStrictMode: true,
};

export default nextConfig;