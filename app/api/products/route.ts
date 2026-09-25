import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "products";

// GET all products
export async function GET() {
  try {
    const client = await clientPromise;
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
    const body = await request.json();

    const {
      name,
      model,
      sku,
      category,
      stock,
      price,
      status,
    } = body;

    if (
      !name ||
      !model ||
      !sku ||
      !category ||
      stock === undefined ||
      price === undefined ||
      !status
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const lastProduct = await db
      .collection(COLLECTION)
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    const id = lastProduct.length > 0 ? lastProduct[0].id + 1 : 1;

    const product = {
      id,
      name,
      model,
      sku,
      category,
      stock: Number(stock),
      price: Number(price),
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
