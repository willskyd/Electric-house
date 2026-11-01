import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  safeStringEqual,
} from "@/lib/admin-auth";
import { NextResponse } from "next/server";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Sign-in request origin is not allowed" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body must be valid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ message: "Sign-in details are invalid" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const identifier = typeof input.identifier === "string" ? input.identifier.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!identifier || !password || identifier.length > 254 || password.length > 1024) {
    return NextResponse.json({ message: "Enter your admin email and password" }, { status: 400 });
  }

  const adminEmail = process.env.MICRO_MEC_ADMIN_EMAIL ?? (
    process.env.NODE_ENV === "production" ? "" : "adminmicro.com"
  );
  const adminPassword = process.env.MICRO_MEC_ADMIN_PASSWORD ?? (
    process.env.NODE_ENV === "production" ? "" : "Admin123"
  );
  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ message: "Admin sign-in is not configured on this server" }, { status: 503 });
  }

  try {
    if (!safeStringEqual(identifier, adminEmail.trim().toLowerCase()) ||
        !safeStringEqual(password, adminPassword)) {
      return NextResponse.json({ message: "Email or password is incorrect" }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true, email: adminEmail.trim().toLowerCase(), role: "admin" });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(adminEmail.trim().toLowerCase()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("Could not create admin session:", error);
    return NextResponse.json({ message: "Admin sign-in is temporarily unavailable" }, { status: 500 });
  }
}
