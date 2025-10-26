/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable Next.js Image Optimization on Netlify
  images: {
    unoptimized: false,
  },
}

module.exports = nextConfig