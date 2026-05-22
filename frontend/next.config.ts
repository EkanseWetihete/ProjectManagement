import { loadEnvConfig } from "@next/env";
import path from "node:path";
import type { NextConfig } from "next";

loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
