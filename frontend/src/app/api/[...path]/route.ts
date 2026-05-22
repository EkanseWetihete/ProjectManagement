import { loadEnvConfig } from "@next/env";
import path from "node:path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

loadEnvConfig(path.resolve(process.cwd(), ".."));

const IS_DEVELOPMENT_MODE = process.env.PM_DEVELOPMENT_MODE === "true";
const BACKEND_BASE_URL = (
  IS_DEVELOPMENT_MODE
    ? process.env.PM_BACKEND_URL_DEV ?? "http://127.0.0.1:8000"
    : process.env.PM_BACKEND_URL_PROD ?? "http://198.46.175.134:8000"
).replace(/\/$/, "");
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "x-project-client-key",
]);

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = new URL(`${BACKEND_BASE_URL}/api/${path.join("/")}`);
  targetUrl.search = new URL(request.url).search;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  if (process.env.PM_APP_CLIENT_KEY) {
    headers.set("X-Project-Client-Key", process.env.PM_APP_CLIENT_KEY);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);

    responseHeaders.delete("content-length");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("transfer-encoding");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        detail: "Backend request failed.",
      },
      { status: 502 },
    );
  }
}

export { proxyRequest as GET, proxyRequest as HEAD, proxyRequest as POST, proxyRequest as PUT, proxyRequest as PATCH, proxyRequest as DELETE, proxyRequest as OPTIONS };
