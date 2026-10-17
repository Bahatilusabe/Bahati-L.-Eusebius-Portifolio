/** @type {import('next').NextConfig} */
import { dirname } from "path";
import { fileURLToPath } from "url";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Set turbopack root at top-level to explicitly define the workspace root.
  // This also avoids the 'unrecognized key' warning for experimental.turbopack.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
