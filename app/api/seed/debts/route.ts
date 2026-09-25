import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";

const debts = [
  {
    id: 1,
    customer: "Harbor Market",
    invoice: "INV-1048",
    items: [
      { name: "Premium Rice 25kg", price: 3080 },
      { name: "Sunflower Oil 5L", price: 1520 },
    ],
    amount: 4600,
    payments: [
      {
        id: 11,
        amount: 2100,
        date: "Jun 18, 2026, 10:14 AM",
      },
    ],
    due: "Today",
    createdAt: "Jun 12, 2026, 9:40 AM",
  },
  {
    id: 2,
    customer: "Maya Grocers",
    invoice: "INV-1045",
    items: [
      { name: "Basmati Rice 10kg", price: 1710 },
      { name: "Blue Label Tea", price: 1140 },
    ],
    amount: 2850,
    payments: [
      {
        id: 12,
        amount: 1500,
        date: "Jun 20, 2026, 2:30 PM",
      },
    ],
    due: "Jun 28",
    createdAt: "Jun 11, 2026, 3:12 PM",
  },
  {
    id: 3,
    customer: "Westside Cafe",
    invoice: "INV-1039",
    items: [
      {
        name: "Sparkling Water 12pk",
        price: 1920,
      },
    ],
    amount: 1920,
    payments: [
      {
        id: 13,
        amount: 1920,
        date: "Jun 21, 2026, 11:05 AM",
      },
    ],
    due: "Jul 02",
    createdAt: "Jun 09, 2026, 11:05 AM",
    paidAt: "Jun 21, 2026, 11:05 AM",
  },
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const existingDebts = await db
      .collection("debts")
      .countDocuments();

    if (existingDebts > 0) {
      return NextResponse.json({
        success: false,
        message: "Debts already exist. Seed skipped.",
        count: existingDebts,
      });
    }

    await db.collection("debts").insertMany(debts);

    return NextResponse.json({
      success: true,
      message: "Debts seeded successfully",
      count: debts.length,
    });
  } catch (error) {
    console.error("Debt seed error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed debts",
      },
      { status: 500 }
    );
  }
}
