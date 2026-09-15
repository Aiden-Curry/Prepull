import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth.ts";
import { BATTLE_NET_COOKIES } from "../../../../../lib/battle-net/config.ts";
import { BattleNetOAuthError } from "../../../../../lib/battle-net/client.ts";
import { battleNetApplicationOrigin, battleNetGrantCookie, completeBattleNetOAuth } from "../../../../../lib/battle-net/flow.ts";
import { BattleNetDomainError } from "../../../../../lib/battle-net/repository.ts";

function safeFailure(request: Request, code: string) { return NextResponse.redirect(new URL(`/auth/signin?battleNet=${encodeURIComponent(code)}`, battleNetApplicationOrigin(request)), 303); }

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const session = await getServerSession(authOptions);
    const result = await completeBattleNetOAuth({ request, state: params.get("state") ?? "", code: params.get("code") ?? undefined, providerError: params.get("error") ?? undefined, browserBinding: request.cookies.get(BATTLE_NET_COOKIES.browserBinding)?.value, currentUserId: session?.user?.id });
    if (result.status === "cancelled") return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodeURIComponent(result.callbackUrl)}&battleNet=cancelled`, battleNetApplicationOrigin(request)), 303);
    const importUrl = `/${result.contentVersion}/battle-net/import?session=${encodeURIComponent(result.importSessionId)}`;
    if (result.status === "linked") return NextResponse.redirect(new URL(importUrl, battleNetApplicationOrigin(request)), 303);
    const response = NextResponse.redirect(new URL(`/auth/battlenet/complete?callbackUrl=${encodeURIComponent(importUrl)}`, battleNetApplicationOrigin(request)), 303); response.cookies.set(battleNetGrantCookie(result.grant)); return response;
  } catch (error) {
    const code = error instanceof BattleNetDomainError ? error.code : error instanceof BattleNetOAuthError ? "provider" : "temporary";
    console.warn("[battle-net-oauth] callback failed", { event: "oauth_callback_failed", errorType: error instanceof Error ? error.name : "unknown", code });
    return safeFailure(request, code);
  }
}
