import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  assetPrefix: process.env.NODE_ENV === "production" ? "./" : undefined,
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
