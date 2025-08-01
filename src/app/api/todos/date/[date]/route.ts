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

    // Validate date format - accept both YYYY-MM-DD and copy-YYYYMMDD-timestamp formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const copyIdRegex = /^copy-\d{8}-\d+$/;

    if (!dateRegex.test(date) && !copyIdRegex.test(date)) {
      return NextResponse.json(
        {
          error:
            "Invalid date format. Use YYYY-MM-DD or copy-YYYYMMDD-timestamp",
        },
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
      message: `已删除 ${result.count} 个任务`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting todos for date:", error);
    return NextResponse.json(
      { error: "Failed to delete todos for date" },
      { status: 500 }
    );
  }
}
