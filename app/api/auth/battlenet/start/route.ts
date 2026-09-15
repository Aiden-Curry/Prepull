import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth.ts";
import { enforceAbusePolicy, rateLimitedJson } from "../../../../../lib/abuse-control/service.ts";
import { battleNetApplicationOrigin, battleNetBindingCookie, beginBattleNetOAuth, validateBattleNetRegion } from "../../../../../lib/battle-net/flow.ts";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== battleNetApplicationOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
    const limited = await enforceAbusePolicy({ endpoint: "oauth_start", request });
    if (!limited.allowed) return rateLimitedJson("Too many Battle.net connection attempts. Try again later.", limited.retryAfterSeconds);
    const form = await request.formData(); const region = validateBattleNetRegion(form.get("region")); const intent = form.get("intent") === "link" ? "link" : "login";
    if (!region) return NextResponse.json({ message: "Choose Europe or Americas." }, { status: 400 });
    const session = await getServerSession(authOptions);
    if (intent === "link" && !session?.user?.id) return NextResponse.redirect(new URL("/auth/signin", request.url), 303);
    const result = await beginBattleNetOAuth({ request, region, intent, initiatingUserId: intent === "link" ? session!.user.id : undefined, callbackUrl: String(form.get("callbackUrl") ?? ""), fixture: process.env.NODE_ENV === "production" ? undefined : String(form.get("fixture") ?? "") });
    const response = NextResponse.redirect(new URL(result.authorizationUrl, battleNetApplicationOrigin(request)), 303); response.cookies.set(battleNetBindingCookie(result.binding)); return response;
  } catch (error) { console.error("[battle-net-oauth] start failed", { event: "oauth_start_failed", errorType: error instanceof Error ? error.name : "unknown" }); return NextResponse.json({ message: "Battle.net login is temporarily unavailable." }, { status: 503 }); }
}
