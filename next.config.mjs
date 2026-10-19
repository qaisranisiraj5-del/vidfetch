/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: hide the X-Powered-By header
  poweredByHeader: false,
  // Keep server-only env vars out of the client bundle by design;
  // only NEXT_PUBLIC_* variables are ever inlined into client JS.
  experimental: {
    // (no experimental flags required)
  },
};

export default nextConfig;
