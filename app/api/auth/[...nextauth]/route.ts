import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth.ts";
import { enforceAbusePolicy, rateLimitedJson } from "../../../../lib/abuse-control/service.ts";

const handler = NextAuth(authOptions);
export { handler as GET };

export async function POST(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const route = (await context.params).nextauth;
  if (route[0] === "callback" && route[1] === "credentials") {
    try {
      const form = await request.clone().formData();
      const limited = await enforceAbusePolicy({ endpoint: "signin", request, accountIdentifier: String(form.get("email") ?? "") });
      if (!limited.allowed) return rateLimitedJson("Too many sign-in attempts. Try again later.", limited.retryAfterSeconds);
    } catch (error) {
      console.error("[abuse-control] sign-in protection unavailable", { event: "signin_protection_error", errorType: error instanceof Error ? error.name : "unknown" });
      return new Response(JSON.stringify({ message: "Sign-in is temporarily unavailable. Try again shortly." }), { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store" } });
    }
  }
  return handler(request as never, context as never);
}
