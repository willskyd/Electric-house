import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "settings";

const defaultSettings = {
  workspace: "Acme Market",
  currency: "NGN",
  notifications: "All activity",
  lowStockThreshold: "30",
  dateFormat: "MMM D, YYYY",
};

export async function GET() {
  try {
    const client = await clientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    let settings = await collection.findOne({ key: "workspace" });

    if (!settings) {
      const newSettings = {
        key: "workspace",
        ...defaultSettings,
      };

      await collection.insertOne(newSettings);
      settings = await collection.findOne({ key: "workspace" });
    }

    if (!settings) {
      throw new Error("Settings could not be loaded");
    }

    const { _id, key, ...publicSettings } = settings;

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error("Failed to load settings:", error);

    return NextResponse.json(
      { message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const allowedFields = [
      "workspace",
      "currency",
      "notifications",
      "lowStockThreshold",
      "dateFormat",
    ];

    const updates: Record<string, string> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = String(body[field]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No settings to update" },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    await collection.updateOne(
      { key: "workspace" },
      {
        $set: {
          ...updates,
          key: "workspace",
        },
      },
      { upsert: true }
    );

    const settings = await collection.findOne({ key: "workspace" });

    if (!settings) {
      throw new Error("Settings could not be saved");
    }

    const { _id, key, ...publicSettings } = settings;

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);

    return NextResponse.json(
      { message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
