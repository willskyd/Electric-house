import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "receipts";

// UPDATE receipt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = Number(id);

    if (!Number.isFinite(receiptId)) {
      return NextResponse.json(
        { message: "Invalid receipt ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updates: Record<string, string | number> = {};

    if (body.name !== undefined) {
      updates.name = String(body.name).trim();
    }

    if (body.model !== undefined) {
      updates.model = String(body.model).trim();
    }

    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity);

      if (!Number.isFinite(quantity) || quantity < 0) {
        return NextResponse.json(
          { message: "Invalid quantity" },
          { status: 400 }
        );
      }

      updates.quantity = quantity;
    }

    if (body.invoice !== undefined) {
      updates.invoice = String(body.invoice).trim();
    }

    if (body.date !== undefined) {
      updates.date = String(body.date).trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).updateOne(
      { id: receiptId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Receipt not found" },
        { status: 404 }
      );
    }

    const updatedReceipt = await db
      .collection(COLLECTION)
      .findOne({ id: receiptId });

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error("Failed to update receipt:", error);

    return NextResponse.json(
      { message: "Failed to update receipt" },
      { status: 500 }
    );
  }
}

// DELETE receipt
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const receiptId = Number(id);

    if (!Number.isFinite(receiptId)) {
      return NextResponse.json(
        { message: "Invalid receipt ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).deleteOne({
      id: receiptId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete receipt:", error);

    return NextResponse.json(
      { message: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
