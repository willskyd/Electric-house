import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { INVENTORY_DB, InventoryError } from "@/lib/inventory";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null || !("name" in body)) throw new InventoryError("Branch name is required");
    const name = (body as { name: unknown }).name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) throw new InventoryError("Branch name must be 1 to 80 characters");
    const client = await clientPromise();
    const collection = client.db(INVENTORY_DB).collection("branches");
    const duplicate = await collection.findOne({ name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, id: { $ne: id } });
    if (duplicate) throw new InventoryError("A branch with that name already exists", 409);
    const result = await collection.findOneAndUpdate({ id }, { $set: { name: name.trim(), updatedAt: new Date() } }, { returnDocument: "after" });
    if (!result) throw new InventoryError("Branch not found", 404);
    const { _id, ...branch } = result;
    return NextResponse.json(branch);
  } catch (error) {
    if (error instanceof InventoryError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("Failed to rename branch:", error);
    return NextResponse.json({ message: "Branch could not be renamed" }, { status: 500 });
  }
}
