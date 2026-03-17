/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Current Essentials
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pixabay.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }, // For Bible Readings & Bulletin
      { protocol: 'https', hostname: 'images.pexels.com' },

      // User Authentication & Social
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // For Google Sign-In profile pictures
      
      // Professional Design Assets
      { protocol: 'https', hostname: 'images.adobe.com' },
      { protocol: 'https', hostname: 'utfs.io' }, // Common for UploadThing if you use it for faster transfers
      
      // Open Source & UI Assets
      { protocol: 'https', hostname: 'raw.githubusercontent.com' }, // For pulling custom icons or logos
      { protocol: 'https', hostname: 'api.dicebear.com' }, // Great for generating 'Member' avatars automatically
    ],
  },
};

export default nextConfig;