import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.BATTLENET_OAUTH_MODE !== "mock") return new Response("Not found", { status: 404 });
  const state = request.nextUrl.searchParams.get("state") ?? ""; const region = request.nextUrl.searchParams.get("region") ?? "eu"; const redirectUri = request.nextUrl.searchParams.get("redirect_uri") ?? ""; const fixture = request.nextUrl.searchParams.get("fixture") ?? "default";
  const approved = new URL(redirectUri); approved.searchParams.set("state", state); approved.searchParams.set("code", `mock:${fixture}:${region}`);
  const denied = new URL(redirectUri); denied.searchParams.set("state", state); denied.searchParams.set("error", "access_denied");
  return new Response(`<!doctype html><html><body><main><h1>Mock Battle.net authorization</h1><p>Deterministic local acceptance only.</p><a href="${approved.toString()}">Authorize</a><a href="${denied.toString()}">Cancel</a></main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
