import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

const DB_NAME = "Dashboard";
const COLLECTION = "activities";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activityId = Number(id);

    if (!Number.isFinite(activityId)) {
      return NextResponse.json(
        { message: "Invalid activity ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (typeof body.read !== "boolean") {
      return NextResponse.json(
        { message: "read must be a boolean" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTION).updateOne(
      { id: activityId },
      {
        $set: {
          read: body.read,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    const updatedActivity = await db
      .collection(COLLECTION)
      .findOne({ id: activityId });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error("Failed to update activity:", error);

    return NextResponse.json(
      { message: "Failed to update activity" },
      { status: 500 }
    );
  }
}
