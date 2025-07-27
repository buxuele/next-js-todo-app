import { NextRequest, NextResponse } from "next/server";
import { searchTodos } from "@/lib/db-utils";

// GET /api/todos/search - Search todos across all dates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Validate query length
    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query cannot be empty" },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: "Search query too long (max 100 characters)" },
        { status: 400 }
      );
    }

    const results = await searchTodos(query.trim());

    return NextResponse.json({
      query: query.trim(),
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching todos:", error);
    return NextResponse.json(
      { error: "Failed to search todos" },
      { status: 500 }
    );
  }
}
