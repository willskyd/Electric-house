import clientPromise from "@/lib/mongodb";
import { isValidBarcode, normalizeBarcode } from "@/lib/barcode";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "products";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// GET all products
export async function GET() {
  try {
    const client = await clientPromise();
    const db = client.db(DB_NAME);

    const products = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: 1 })
      .toArray();

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST a new product
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Request body must be valid JSON" }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ message: "Product details must be a JSON object" }, { status: 400 });
    }

    const { name, model, sku, category, stock, price, status } = body;
    const barcodeValue = body.barcode === undefined ? "" : body.barcode;
    const parsedStock = Number(stock);
    const parsedPrice = Number(price);

    if (
      typeof name !== "string" || !name.trim() ||
      typeof model !== "string" || !model.trim() ||
      typeof sku !== "string" || !sku.trim() ||
      typeof category !== "string" || !category.trim() ||
      typeof status !== "string" || !status.trim() ||
      stock === undefined || !Number.isFinite(parsedStock) || parsedStock < 0 ||
      price === undefined || !Number.isFinite(parsedPrice) || parsedPrice < 0 ||
      typeof barcodeValue !== "string"
    ) {
      return NextResponse.json(
        { message: "Product details are invalid or incomplete" },
        { status: 400 }
      );
    }

    const barcode = normalizeBarcode(barcodeValue);
    if (!isValidBarcode(barcode)) {
      return NextResponse.json(
        { message: "Barcode must be 128 characters or fewer and contain no control characters" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);

    if (barcode) {
      const duplicateBarcode = await db.collection(COLLECTION).findOne({
        $expr: {
          $eq: [
            { $trim: { input: { $cond: [{ $eq: [{ $type: "$barcode" }, "string"] }, "$barcode", ""] } } },
            barcode,
          ],
        },
      });
      if (duplicateBarcode) {
        return NextResponse.json(
          { message: "That barcode is already assigned to another product" },
          { status: 409 }
        );
      }
    }

    const lastProduct = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const id = lastProduct.length > 0 ? lastProduct[0].id + 1 : 1;

    const product = {
      id,
      name: name.trim(),
      model: model.trim(),
      sku: sku.trim(),
      category: category.trim(),
      barcode,
      stock: parsedStock,
      price: parsedPrice,
      status,
    };

    await db.collection(COLLECTION).insertOne(product);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);

    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 }
    );
  }
}
