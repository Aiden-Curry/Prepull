type Check = { name: string; ok: boolean; detail: string };
export {};

const argument = process.argv.find((value) => value.startsWith("--base-url="))?.slice("--base-url=".length);
const rawBase = argument || process.env.DEPLOYMENT_ACCEPTANCE_URL;
const checks: Check[] = [];
const internalLeak = /(localhost|127\.0\.0\.1|0\.0\.0\.0|:3000|:3100|:3443|internal-host)/i;

function fail(message: string): never { throw new Error(message); }
function add(name: string, ok: boolean, detail: string) { checks.push({ name, ok, detail }); }

if (!rawBase) fail("Provide --base-url=https://host or DEPLOYMENT_ACCEPTANCE_URL.");
let base: URL;
try { base = new URL(rawBase); } catch { fail("Deployment acceptance URL is not a valid absolute URL."); }
if (base.protocol !== "https:") fail("Deployment acceptance refuses non-HTTPS URLs.");
if (base.username || base.password) fail("Deployment acceptance URL must not contain credentials.");
if ((base.hostname === "localhost" || base.hostname === "127.0.0.1") && process.env.DEPLOYMENT_ACCEPTANCE_LOCAL_TEST !== "true") fail("Localhost requires DEPLOYMENT_ACCEPTANCE_LOCAL_TEST=true.");
if (process.env.NEXTAUTH_URL && new URL(process.env.NEXTAUTH_URL).origin !== base.origin) fail("--base-url must match NEXTAUTH_URL when NEXTAUTH_URL is configured.");

async function request(path: string, init?: RequestInit) {
  const url = new URL(path, base);
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(10_000) });
  const location = response.headers.get("location") || "";
  const body = await response.text();
  add(path, !internalLeak.test(location) && !internalLeak.test(body), `${response.status} ${response.statusText}`);
  return { response, location, body };
}

try {
  const live = await request("/api/health/live");
  add("live status", live.response.status === 200, `expected 200, got ${live.response.status}`);
  const ready = await request("/api/health/ready");
  add("readiness status", ready.response.status === 200, `expected 200, got ${ready.response.status}`);
  const signIn = await request("/auth/signin");
  add("sign-in page", signIn.response.status === 200, `expected 200, got ${signIn.response.status}`);
  const protectedRoute = await request("/era/guilds");
  add("protected redirect", protectedRoute.response.status >= 300 && protectedRoute.response.status < 400 && /signin/i.test(protectedRoute.location), `expected auth redirect, got ${protectedRoute.response.status}`);

  const credentials = process.env.DEPLOYMENT_ACCEPTANCE_EMAIL && process.env.DEPLOYMENT_ACCEPTANCE_PASSWORD;
  if (!credentials) {
    console.log("Authenticated checks: SKIPPED (DEPLOYMENT_ACCEPTANCE_EMAIL/PASSWORD not configured; no credentials are bundled).");
  } else {
    console.log("Authenticated checks: credentials supplied; use the deployment's configured test account for the full browser matrix.");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Deployment acceptance request failed.");
}

for (const check of checks) console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`);
if (checks.some((check) => !check.ok)) process.exitCode = 1;
