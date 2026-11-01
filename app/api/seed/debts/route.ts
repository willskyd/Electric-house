import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";

const debts = [
  {
    id: 1,
    customer: "Harbor Mobile",
    invoice: "INV-1048",
    items: [
      { name: "20,000mAh Power Bank", price: 28500 },
      { name: "USB-C Fast Charge Cable", price: 3500 },
    ],
    amount: 32000,
    payments: [
      {
        id: 11,
        amount: 12000,
        date: "Oct 29, 2026, 10:14 AM",
      },
    ],
    due: "Today",
    createdAt: "Oct 25, 2026, 9:40 AM",
  },
  {
    id: 2,
    customer: "Maya Telecom",
    invoice: "INV-1045",
    items: [
      { name: "20W USB-C Charger", price: 12500 },
      { name: "Tempered Glass Screen Guard", price: 2500 },
    ],
    amount: 15000,
    payments: [
      {
        id: 12,
        amount: 5000,
        date: "Oct 30, 2026, 2:30 PM",
      },
    ],
    due: "Nov 07, 2026",
    createdAt: "Oct 27, 2026, 3:12 PM",
  },
  {
    id: 3,
    customer: "Westside Phones",
    invoice: "INV-1039",
    items: [
      {
        name: "Wireless Earbuds",
        price: 18500,
      },
    ],
    amount: 18500,
    payments: [
      {
        id: 13,
        amount: 18500,
        date: "Oct 28, 2026, 11:05 AM",
      },
    ],
    due: "Oct 28, 2026",
    createdAt: "Oct 20, 2026, 11:05 AM",
    paidAt: "Oct 28, 2026, 11:05 AM",
  },
];

export async function GET() {
  try {
    const client = await clientPromise();
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
