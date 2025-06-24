/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "localhost"],
  },
  output: 'standalone'
};

module.exports = nextConfig;
