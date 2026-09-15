import { NextResponse } from "next/server";
import { enforceAbusePolicy, rateLimitedJson } from "../../../../lib/abuse-control/service";
import { PUBLIC_LOOKUP_BOUNDS } from "../../../../lib/public-character/config";
import { lookupPublicCharacter } from "../../../../lib/public-character/lookup";
import { normalizePublicLookup } from "../../../../lib/public-character/path";
import type { CharacterRealmType, ContentVersion, Region } from "../../../../lib/types";

export async function GET(request: Request) {
  if (request.url.length > PUBLIC_LOOKUP_BOUNDS.maxUrlLength) return NextResponse.json({ status: "invalid", message: "Character lookup is too long." }, { status: 414 });
  const search = new URL(request.url).searchParams;
  const input = { contentVersion: search.get("version") as ContentVersion, realmType: search.get("realmType") as CharacterRealmType, region: search.get("region") as Region, realm: search.get("realm") ?? "", characterName: search.get("name") ?? "" };
  const validation = normalizePublicLookup(input);
  if (!validation.ok) return NextResponse.json({ status: "invalid", message: validation.message }, { status: 400, headers: { "cache-control": "private, no-store" } });
  const limited = await enforceAbusePolicy({ endpoint: "public_lookup", request });
  if (!limited.allowed) return rateLimitedJson("Too many character searches. Try again shortly.", limited.retryAfterSeconds);
  const result = await lookupPublicCharacter(input);
  const status = result.status === "invalid" ? 400 : result.status === "not_found" ? 404 : result.status === "temporary_error" ? 503 : 200;
  return NextResponse.json(result, { status, headers: { "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow" } });
}
