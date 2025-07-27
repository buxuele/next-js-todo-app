import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";

// DELETE /api/todos/date/[date] - Delete all todos for a specific date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const result = await withRetry(async () => {
      return await prisma.todo.deleteMany({
        where: { date },
      });
    });

    // Also delete any date alias for this date
    await withRetry(async () => {
      return await prisma.dateAlias.deleteMany({
        where: { date },
      });
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting todos for date:", error);
    return NextResponse.json(
      { error: "Failed to delete todos for date" },
      { status: 500 }
    );
  }
}
