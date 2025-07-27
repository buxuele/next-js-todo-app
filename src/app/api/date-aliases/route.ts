import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";

// GET /api/date-aliases - Get all date aliases
export async function GET() {
  try {
    const aliases = await withRetry(async () => {
      return await prisma.dateAlias.findMany({
        orderBy: { date: "desc" },
      });
    });

    return NextResponse.json(aliases);
  } catch (error) {
    console.error("Error fetching date aliases:", error);
    return NextResponse.json(
      { error: "Failed to fetch date aliases" },
      { status: 500 }
    );
  }
}

// POST /api/date-aliases - Create or update a date alias
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, alias } = body;

    if (!date || !alias) {
      return NextResponse.json(
        { error: "Date and alias are required" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate alias
    if (alias.trim().length === 0) {
      return NextResponse.json(
        { error: "Alias cannot be empty" },
        { status: 400 }
      );
    }

    if (alias.length > 100) {
      return NextResponse.json(
        { error: "Alias too long (max 100 characters)" },
        { status: 400 }
      );
    }

    // Check if todos exist for this date
    const todosExist = await withRetry(async () => {
      const count = await prisma.todo.count({
        where: { date },
      });
      return count > 0;
    });

    if (!todosExist) {
      return NextResponse.json(
        { error: "Cannot create alias for date with no todos" },
        { status: 400 }
      );
    }

    // Create or update alias
    const dateAlias = await withRetry(async () => {
      return await prisma.dateAlias.upsert({
        where: { date },
        update: { alias: alias.trim() },
        create: {
          date,
          alias: alias.trim(),
        },
      });
    });

    return NextResponse.json(dateAlias);
  } catch (error) {
    console.error("Error creating/updating date alias:", error);
    return NextResponse.json(
      { error: "Failed to create/update date alias" },
      { status: 500 }
    );
  }
}
