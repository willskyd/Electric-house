import clientPromise from "@/lib/mongodb";
import { normalizeDebtRequest } from "@/lib/debt";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "debts";
const PRODUCTS_COLLECTION = "products";

// GET all debts
export async function GET() {
  try {
    const client = await clientPromise();
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Request body must be valid JSON" }, { status: 400 });
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Debt details must be a JSON object" }, { status: 400 });
    }

    const products = Object.hasOwn(body, "item")
      ? []
      : await db.collection(PRODUCTS_COLLECTION).find({}).toArray();
    const normalizedDebt = normalizeDebtRequest(body, products);

    if (normalizedDebt.stockTracked) for (const item of normalizedDebt.items) {
      const product = products.find((entry) => Number(entry.id) === item.productId);
      if (!product) {
        return NextResponse.json({ message: `Product ${item.productId} was not found in stock` }, { status: 404 });
      }

      const requestedQuantity = Number(item.quantity);
      const availableStock = Number(product.stock ?? 0);
      if (requestedQuantity > availableStock + 0.000001) {
        return NextResponse.json(
          { message: `Not enough stock for ${product.name}. Available: ${availableStock.toLocaleString()}` },
          { status: 400 }
        );
      }
    }

    const lastDebt = await db
      .collection(COLLECTION)
      .find({ id: { $type: "number" } })
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const lastNumericId = lastDebt.length > 0 && typeof lastDebt[0].id === "number" ? lastDebt[0].id : 0;
    const id = lastNumericId + 1;

    const debt = {
      id,
      customer: normalizedDebt.customer,
      invoice: normalizedDebt.invoice,
      ...(normalizedDebt.receiptNumber ? { receiptNumber: normalizedDebt.receiptNumber } : {}),
      items: normalizedDebt.items,
      amount: Number(normalizedDebt.amount),
      payments: normalizedDebt.payments || [],
      due: normalizedDebt.due,
      createdAt: normalizedDebt.createdAt,
      ...(normalizedDebt.paidAt ? { paidAt: normalizedDebt.paidAt } : {}),
    };

    if (normalizedDebt.stockTracked) {
      for (const item of debt.items) {
        await db.collection(PRODUCTS_COLLECTION).updateOne(
          { id: item.productId },
          { $inc: { stock: -Number(item.quantity) } }
        );
      }
    }

    await db.collection(COLLECTION).insertOne(debt);

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("Failed to create debt:", error);

    const message = error instanceof Error ? error.message : "Failed to create debt";
    const status = message.includes("not enough stock") || message.includes("required") || message.includes("invalid") || message.includes("Select") || message.includes("Add at least one") || message.includes("Product") || message.includes("must be")
      ? 400
      : 500;

    return NextResponse.json(
      { message },
      { status }
    );
  }
}
