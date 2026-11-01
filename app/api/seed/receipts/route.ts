import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";

const receipts = [
  {
    id: 1,
    name: "20W USB-C Charger",
    model: "MEC-CHG-20W",
    quantity: 18,
    invoice: "REC-1001",
    date: "Oct 30, 2026, 4:20 PM",
  },
];

export async function GET() {
  try {
    const client = await clientPromise();
    const db = client.db(DB_NAME);

    const existingReceipts = await db
      .collection("receipts")
      .countDocuments();

    if (existingReceipts > 0) {
      return NextResponse.json({
        success: false,
        message: "Receipts already exist. Seed skipped.",
        count: existingReceipts,
      });
    }

    await db.collection("receipts").insertMany(receipts);

    return NextResponse.json({
      success: true,
      message: "Receipts seeded successfully",
      count: receipts.length,
    });
  } catch (error) {
    console.error("Receipt seed error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed receipts",
      },
      { status: 500 }
    );
  }
}
