import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    return NextResponse.json(session
      ? { authenticated: true, email: session.email, role: session.role }
      : { authenticated: false });
  } catch (error) {
    console.error("Could not verify admin session:", error);
    return NextResponse.json({ message: "Admin session verification is unavailable" }, { status: 500 });
  }
}
