import { NextResponse } from "next/server";
import { getTodoCountsByDate } from "@/lib/db-utils";

// GET /api/todos/counts - Get todo counts by date
export async function GET() {
  try {
    const counts = await getTodoCountsByDate();
    return NextResponse.json(counts);
  } catch (error) {
    console.error("Error fetching todo counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch todo counts" },
      { status: 500 }
    );
  }
}
