import { loadEnvConfig } from "@next/env";
import path from "node:path";
import type { NextConfig } from "next";

loadEnvConfig(path.resolve(process.cwd(), ".."));

function readHostname(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  process.env.PM_FRONTEND_HOST,
  readHostname(process.env.PM_BACKEND_URL_DEV),
  readHostname(process.env.PM_BACKEND_URL_PROD),
].filter((value, index, allValues): value is string => Boolean(value) && allValues.indexOf(value) === index);

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
