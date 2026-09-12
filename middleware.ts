import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { authSignInHref } from "./lib/auth-callback";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(new URL(authSignInHref(callbackUrl), request.url));
}

export const config = {
  matcher: [
    "/:version(era|tbc)/dashboard/:path*",
    "/:version(era|tbc)/profile/:path*",
    "/:version(era|tbc)/onboarding/:path*",
    "/:version(era|tbc)/characters/connect/:path*",
    "/:version(era|tbc)/guilds/:path*",
  ],
};
