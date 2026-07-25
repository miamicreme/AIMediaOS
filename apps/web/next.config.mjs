/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aimediaos/shared", "@aimediaos/workflows", "@aimediaos/providers", "@aimediaos/db"],
};

export default nextConfig;
