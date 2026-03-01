/** @type {import('next').NextConfig} */
const config = {
  images: {
    domains: ['flippa.com', 'cdn.flippa.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}
export default config
