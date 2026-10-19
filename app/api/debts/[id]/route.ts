import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "debts";

function debtSelector(value: string): { id: number | string } | null {
  const numericId = Number(value);
  if (Number.isSafeInteger(numericId) && numericId > 0) return { id: numericId };
  return value.trim() ? { id: value } : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const selector = debtSelector(id);

    if (!selector) {
      return NextResponse.json(
        { message: "Invalid debt ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const allowedFields = [
      "customer",
      "invoice",
      "receiptNumber",
      "items",
      "amount",
      "payments",
      "due",
      "createdAt",
      "paidAt",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if ("receiptNumber" in updates) {
      if (typeof updates.receiptNumber !== "string" || updates.receiptNumber.length > 100) {
        return NextResponse.json(
          { message: "Receipt number must be a string of 100 characters or fewer" },
          { status: 400 }
        );
      }
      updates.receiptNumber = updates.receiptNumber.trim();
    }

    if ("amount" in updates) {
      updates.amount = Number(updates.amount);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).updateOne(
      selector,
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Debt not found" },
        { status: 404 }
      );
    }

    const updatedDebt = await db.collection(COLLECTION).findOne({
      ...selector,
    });

    return NextResponse.json(updatedDebt);
  } catch (error) {
    console.error("Failed to update debt:", error);

    return NextResponse.json(
      { message: "Failed to update debt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const selector = debtSelector(id);

    if (!selector) {
      return NextResponse.json(
        { message: "Invalid debt ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).deleteOne({
      ...selector,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Debt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Debt deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete debt:", error);

    return NextResponse.json(
      { message: "Failed to delete debt" },
      { status: 500 }
    );
  }
}
