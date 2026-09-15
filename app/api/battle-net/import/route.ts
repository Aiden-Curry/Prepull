import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authOptions } from "../../../../lib/auth.ts";
import { enforceAbusePolicy, rateLimitedJson } from "../../../../lib/abuse-control/service.ts";
import { importBattleNetCharacter } from "../../../../lib/battle-net/import-service.ts";
import { battleNetApplicationOrigin } from "../../../../lib/battle-net/flow.ts";
import { BattleNetDomainError } from "../../../../lib/battle-net/repository.ts";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: "Sign in to import characters." }, { status: 401 });
  if (request.headers.get("origin") !== battleNetApplicationOrigin(request)) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const limited = await enforceAbusePolicy({ endpoint: "battle_net_import", request, accountIdentifier: session.user.id });
  if (!limited.allowed) return rateLimitedJson("Too many import attempts. Try again shortly.", limited.retryAfterSeconds);
  try {
    const body = await request.json() as { sessionId?: string; characterId?: string };
    if (!body.sessionId || !body.characterId) return NextResponse.json({ message: "Choose a discovered character." }, { status: 400 });
    const result = await importBattleNetCharacter({ userId: session.user.id, sessionId: body.sessionId, characterId: body.characterId });
    revalidatePath("/era/dashboard"); revalidatePath("/tbc/dashboard"); revalidatePath("/era/onboarding"); revalidatePath("/tbc/onboarding");
    return NextResponse.json({ character: result });
  } catch (error) {
    const status = error instanceof BattleNetDomainError && ["not_found", "forbidden"].includes(error.code) ? 404 : error instanceof BattleNetDomainError && error.code === "expired" ? 410 : error instanceof BattleNetDomainError && error.code === "busy" ? 409 : 500;
    return NextResponse.json({ message: status === 410 ? "This discovery session expired. Refresh characters to start again." : status === 409 ? "This character is already importing." : "This character could not be imported." }, { status });
  }
}
