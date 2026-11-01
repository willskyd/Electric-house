import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

const publicAuthRoutes = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
]);

export function proxy(request: NextRequest) {
  if (publicAuthRoutes.has(request.nextUrl.pathname)) return NextResponse.next();

  try {
    const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (session) return NextResponse.next();
  } catch (error) {
    console.error("Admin session validation failed:", error);
  }

  return NextResponse.json({ message: "Admin sign-in is required" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};
