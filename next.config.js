/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Capacitor, we don't need static export - regular build works fine
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
    ],
  },
};

module.exports = nextConfig;
