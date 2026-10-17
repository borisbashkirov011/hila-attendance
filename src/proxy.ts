import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidAuthToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (await isValidAuthToken(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except the login page, the token-protected calendar feed and static assets.
    "/((?!login|api/calendar/feed|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
