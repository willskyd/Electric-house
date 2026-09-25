import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "activities";

const defaultActivities = [
  {
    id: 1,
    text: "Payment received from Westside Cafe",
    detail:
      "A payment of ₦1,920 was received from Westside Cafe and matched to invoice INV-1039.",
    time: "Jun 21, 2026, 11:05 AM",
    read: false,
  },
  {
    id: 2,
    text: "New stock receipt completed",
    detail:
      "A stock receipt for 180 units was recorded for June grocery delivery with model MEC-RIC-2501.",
    time: "Jun 20, 2026, 4:20 PM",
    read: false,
  },
  {
    id: 3,
    text: "Debt added for Harbor Market",
    detail:
      "A new debt entry for Harbor Market was created with a total amount of ₦4,600.",
    time: "Jun 12, 2026, 9:40 AM",
    read: true,
  },
];

// GET all activities
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    let activities = await collection
      .find({})
      .sort({ id: -1 })
      .limit(50)
      .toArray();

    // Seed default activities if the collection is empty.
    if (activities.length === 0) {
      await collection.insertMany(defaultActivities);

      activities = await collection
        .find({})
        .sort({ id: -1 })
        .limit(50)
        .toArray();
    }

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Failed to load activities:", error);

    return NextResponse.json(
      { message: "Failed to load activities" },
      { status: 500 }
    );
  }
}

// POST a new activity
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const text = String(body.text || "").trim();
    const detail = body.detail
      ? String(body.detail).trim()
      : undefined;
    const time = String(body.time || "").trim();

    if (!text || !time) {
      return NextResponse.json(
        { message: "Activity text and time are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    const activity = {
      id: Date.now(),
      text,
      ...(detail ? { detail } : {}),
      time,
      read: false,
    };

    await collection.insertOne(activity);

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Failed to create activity:", error);

    return NextResponse.json(
      { message: "Failed to create activity" },
      { status: 500 }
    );
  }
}