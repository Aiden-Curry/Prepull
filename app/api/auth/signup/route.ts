import { NextResponse } from "next/server";
import { registerAccount } from "../../../../lib/accounts/signup";
import { enforceAbusePolicy, rateLimitedJson } from "../../../../lib/abuse-control/service";
import { GuildDomainError } from "../../../../lib/guilds/errors";

const MAX_SIGNUP_BODY_BYTES = 4096;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  const requestOrigins = new Set([new URL(request.url).origin, host ? `${protocol}://${host}` : ""]);
  if (!origin || !requestOrigins.has(origin)) return NextResponse.json({ message: "This signup request could not be verified." }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ message: "Send signup details as JSON." }, { status: 415 });
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > MAX_SIGNUP_BODY_BYTES) return NextResponse.json({ message: "Signup request is too large." }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return NextResponse.json({ message: "Enter valid signup details." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ message: "Enter valid signup details." }, { status: 400 });
  const values = input as Record<string, unknown>;
  try {
    const limited = await enforceAbusePolicy({ endpoint: "signup", request, accountIdentifier: String(values.email ?? "") });
    if (!limited.allowed) return rateLimitedJson("Too many signup attempts. Try again later.", limited.retryAfterSeconds);
    const result = await registerAccount({ email: String(values.email ?? ""), password: String(values.password ?? ""), confirmPassword: String(values.confirmPassword ?? "") });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ email: result.account.email }, { status: 201 });
  } catch (error) {
    if (error instanceof GuildDomainError && error.code === "DUPLICATE") return NextResponse.json({ code: "ACCOUNT_EXISTS", field: "email", message: "An account with that email already exists. Try signing in." }, { status: 409 });
    return NextResponse.json({ message: "We couldn't create your account right now. Try again shortly." }, { status: 503 });
  }
}
