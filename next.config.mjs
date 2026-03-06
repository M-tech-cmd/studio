/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Clean config for Next.js 16 */
  experimental: {
    // Removed invalid 'turbo' key
  },
  // Removed deprecated 'eslint' key to prevent startup errors
};

export default nextConfig;
