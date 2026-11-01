import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";

const products = [
  {
    id: 1,
    name: "20,000mAh Power Bank",
    model: "MEC-PWB-20000",
    sku: "PWB-20000",
    category: "Power banks",
    stock: 24,
    price: 28500,
    status: "In stock",
  },
  {
    id: 2,
    name: "20W USB-C Charger",
    model: "MEC-CHG-20W",
    sku: "CHG-20W",
    category: "Chargers",
    stock: 18,
    price: 12500,
    status: "In stock",
  },
  {
    id: 3,
    name: "USB-C Fast Charge Cable",
    model: "MEC-CBL-USBC",
    sku: "CBL-USBC",
    category: "Cables",
    stock: 7,
    price: 3500,
    status: "Low stock",
  },
  {
    id: 4,
    name: "Wireless Earbuds",
    model: "MEC-EAR-BT01",
    sku: "EAR-BT01",
    category: "Earphones",
    stock: 0,
    price: 18500,
    status: "Out of stock",
  },
  {
    id: 5,
    name: "Tempered Glass Screen Guard",
    model: "MEC-SCR-TG01",
    sku: "SCR-TG01",
    category: "Screen guards",
    stock: 32,
    price: 2500,
    status: "In stock",
  },
];

export async function GET() {
  try {
    const client = await clientPromise();
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
