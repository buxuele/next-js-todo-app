import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";
import { getTodosByDate, getNextOrderNum } from "@/lib/db-utils";

// POST /api/todos/copy-date - Copy todos from one date to another
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source_date,
      target_date,
      fromDate,
      toDate,
      copyCompleted = false,
    } = body;

    // Support both Flask-style and Next.js-style parameter names
    const sourceDate = source_date || fromDate;
    const targetDate = target_date || toDate;

    if (!sourceDate || !targetDate) {
      return NextResponse.json(
        { error: "source_date and target_date are required" },
        { status: 400 }
      );
    }

    // Validate date formats - accept both YYYY-MM-DD and copy-YYYYMMDD-timestamp formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const copyIdRegex = /^copy-\d{8}-\d+$/;

    if (!dateRegex.test(sourceDate) && !copyIdRegex.test(sourceDate)) {
      return NextResponse.json(
        {
          error:
            "Invalid source_date format. Use YYYY-MM-DD or copy-YYYYMMDD-timestamp",
        },
        { status: 400 }
      );
    }

    if (!dateRegex.test(targetDate) && !copyIdRegex.test(targetDate)) {
      return NextResponse.json(
        {
          error:
            "Invalid target_date format. Use YYYY-MM-DD or copy-YYYYMMDD-timestamp",
        },
        { status: 400 }
      );
    }

    if (sourceDate === targetDate) {
      return NextResponse.json(
        { error: "Source and destination dates cannot be the same" },
        { status: 400 }
      );
    }

    // Get todos from source date
    const sourceTodos = await getTodosByDate(sourceDate);

    if (sourceTodos.length === 0) {
      // Even if no todos, create empty table for target date (like Flask version)
      return NextResponse.json({
        success: true,
        message: `已复制 0 个任务`,
        count: 0,
      });
    }

    // Filter todos based on copyCompleted flag
    const todosToCreate = copyCompleted
      ? sourceTodos
      : sourceTodos.filter((todo) => !todo.completed);

    // Get starting order number for destination date
    let orderNum = await getNextOrderNum(targetDate);

    // Create new todos for destination date
    const createdTodos = await withRetry(async () => {
      return await prisma.$transaction(
        todosToCreate.map((todo) =>
          prisma.todo.create({
            data: {
              content: todo.content,
              date: targetDate,
              orderNum: orderNum++,
              completed: false, // Always create as incomplete
              completedAt: null,
            },
          })
        )
      );
    });

    return NextResponse.json({
      message: `已复制 ${createdTodos.length} 个任务`,
      count: createdTodos.length,
    });
  } catch (error) {
    console.error("Error copying todos:", error);
    return NextResponse.json(
      { error: "Failed to copy todos" },
      { status: 500 }
    );
  }
}
