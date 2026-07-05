/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@aimediaos/shared", "@aimediaos/workflows", "@aimediaos/providers"],
};

export default nextConfig;
