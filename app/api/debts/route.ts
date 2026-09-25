import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "debts";

// GET all debts
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const debts = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: 1 })
      .toArray();

    return NextResponse.json(debts);
  } catch (error) {
    console.error("Failed to fetch debts:", error);

    return NextResponse.json(
      { message: "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

// POST a new debt
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer,
      invoice,
      items,
      amount,
      payments,
      due,
      createdAt,
      paidAt,
    } = body;

    if (
      !customer ||
      !invoice ||
      !items ||
      amount === undefined ||
      !due ||
      !createdAt
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const lastDebt = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const id = lastDebt.length > 0 ? lastDebt[0].id + 1 : 1;

    const debt = {
      id,
      customer,
      invoice,
      items,
      amount: Number(amount),
      payments: payments || [],
      due,
      createdAt,
      ...(paidAt ? { paidAt } : {}),
    };

    await db.collection(COLLECTION).insertOne(debt);

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("Failed to create debt:", error);

    return NextResponse.json(
      { message: "Failed to create debt" },
      { status: 500 }
    );
  }
}
