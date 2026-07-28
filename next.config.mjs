/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Trusted origins for dev asset/HMR requests behind a proxy.
  allowedDevOrigins: ['*.e2b.app'],
};
export default nextConfig;
