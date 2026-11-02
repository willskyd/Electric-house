import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Demo data seeding is disabled." },
    { status: 410 },
  );
}
