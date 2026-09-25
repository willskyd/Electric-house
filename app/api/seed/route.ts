import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";

const products = [
  {
    id: 1,
    name: "Premium Rice 25kg",
    model: "MEC-RIC-2501",
    sku: "RIC-2501",
    category: "Groceries",
    stock: 248,
    price: 38.5,
    status: "In stock",
  },
  {
    id: 2,
    name: "Sunflower Oil 5L",
    model: "MEC-OIL-5002",
    sku: "OIL-5002",
    category: "Groceries",
    stock: 86,
    price: 14.9,
    status: "In stock",
  },
  {
    id: 3,
    name: "Blue Label Tea",
    model: "MEC-TEA-1008",
    sku: "TEA-1008",
    category: "Beverages",
    stock: 22,
    price: 8.25,
    status: "Low stock",
  },
  {
    id: 4,
    name: "Basmati Rice 10kg",
    model: "MEC-RIC-1004",
    sku: "RIC-1004",
    category: "Groceries",
    stock: 0,
    price: 21.2,
    status: "Out of stock",
  },
  {
    id: 5,
    name: "Sparkling Water 12pk",
    model: "MEC-WAT-1210",
    sku: "WAT-1210",
    category: "Beverages",
    stock: 64,
    price: 11.75,
    status: "In stock",
  },
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const existingProducts = await db
      .collection("products")
      .countDocuments();

    if (existingProducts > 0) {
      return NextResponse.json({
        success: false,
        message: "Products already exist. Seed skipped.",
        count: existingProducts,
      });
    }

    await db.collection("products").insertMany(products);

    return NextResponse.json({
      success: true,
      message: "Products seeded successfully",
      count: products.length,
    });
  } catch (error) {
    console.error("Seed error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed products",
      },
      { status: 500 }
    );
  }
}
