import { DB_NAME as ELECTRIC_HOUSE_DB } from "@/lib/database";
import type { Document } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = ELECTRIC_HOUSE_DB;
const SALES_COLLECTION = "sales";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { message: "Both start and end dates are required" },
        { status: 400 },
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate >= toDate
    ) {
      return NextResponse.json(
        { message: "Invalid sales date range" },
        { status: 400 },
      );
    }

    const match: Document = {
      cancelled: { $ne: true },
      status: { $not: /^(cancelled|void|refunded)$/i },
      "payment.status": { $not: /^(cancelled|void|refunded)$/i },
      createdAt: {
        $gte: fromDate,
        $lt: toDate,
      },
    };

    const client = await clientPromise();

    const items = await client
      .db(DB_NAME)
      .collection(SALES_COLLECTION)
      .aggregate<{
        productId: number;
        name: string;
        quantitySold: number;
      }>([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.name" },
            quantitySold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { quantitySold: -1, name: 1 } },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: 1,
            quantitySold: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      items,
      totalUnits: items.reduce((sum, item) => sum + item.quantitySold, 0),
      productCount: items.length,
    });
  } catch (error) {
    console.error("Failed to generate units sold report:", error);

    return NextResponse.json(
      { message: "Units sold report is unavailable" },
      { status: 500 },
    );
  }
}
