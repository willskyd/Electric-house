import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "receipts";

// GET all receipts
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const receipts = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: -1 })
      .toArray();

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Failed to fetch receipts:", error);

    return NextResponse.json(
      { message: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}

// POST a new receipt
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      model,
      quantity,
      invoice,
      date,
    } = body;

    if (
      !name ||
      !model ||
      quantity === undefined ||
      !invoice ||
      !date
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const lastReceipt = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const id =
      lastReceipt.length > 0
        ? lastReceipt[0].id + 1
        : 1;

    const receipt = {
      id,
      name,
      model,
      quantity: Number(quantity),
      invoice,
      date,
    };

    await db.collection(COLLECTION).insertOne(receipt);

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Failed to create receipt:", error);

    return NextResponse.json(
      { message: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
