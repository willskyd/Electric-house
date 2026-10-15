import clientPromise from "@/lib/mongodb";
import { isValidBarcode, normalizeBarcode } from "@/lib/barcode";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "products";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Request body must be valid JSON" }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ message: "Product updates must be a JSON object" }, { status: 400 });
    }

    const allowedFields = [
      "name",
      "model",
      "sku",
      "barcode",
      "category",
      "stock",
      "price",
      "status",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if ("barcode" in updates) {
      const barcodeValue = updates.barcode;
      if (typeof barcodeValue !== "string") {
        return NextResponse.json({ message: "Barcode must be text" }, { status: 400 });
      }
      const barcode = normalizeBarcode(barcodeValue);
      if (!isValidBarcode(barcode)) {
        return NextResponse.json(
          { message: "Barcode must be 128 characters or fewer and contain no control characters" },
          { status: 400 }
        );
      }
      updates.barcode = barcode;
    }

    if ("stock" in updates) {
      const stock = Number(updates.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ message: "Stock must be a non-negative number" }, { status: 400 });
      }
      updates.stock = stock;
    }

    if ("price" in updates) {
      const price = Number(updates.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ message: "Price must be a non-negative number" }, { status: 400 });
      }
      updates.price = price;
    }

    if ("status" in updates &&
      !["In stock", "Low stock", "Out of stock", "Discontinued"].includes(String(updates.status))) {
      return NextResponse.json({ message: "Product status is invalid" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    if (typeof updates.barcode === "string" && updates.barcode) {
      const duplicateBarcode = await db.collection(COLLECTION).findOne({
        $expr: {
          $eq: [
            { $trim: { input: { $cond: [{ $eq: [{ $type: "$barcode" }, "string"] }, "$barcode", ""] } } },
            updates.barcode,
          ],
        },
        id: { $ne: productId },
      });
      if (duplicateBarcode) {
        return NextResponse.json(
          { message: "That barcode is already assigned to another product" },
          { status: 409 }
        );
      }
    }

    const result = await db.collection(COLLECTION).updateOne(
      { id: productId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const updatedProduct = await db.collection(COLLECTION).findOne({
      id: productId,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Failed to update product:", error);

    return NextResponse.json(
      { message: "Failed to update product" },
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
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).deleteOne({
      id: productId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);

    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
