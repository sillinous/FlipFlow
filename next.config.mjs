/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['flippa.com', 'cdn.flippa.com'],
  },
}
export default config
