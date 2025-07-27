import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";
import { getTodosByDate, getNextOrderNum } from "@/lib/db-utils";

// POST /api/todos/copy-date - Copy todos from one date to another
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromDate, toDate, copyCompleted = false } = body;

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      );
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (fromDate === toDate) {
      return NextResponse.json(
        { error: "Source and destination dates cannot be the same" },
        { status: 400 }
      );
    }

    // Get todos from source date
    const sourceTodos = await getTodosByDate(fromDate);

    if (sourceTodos.length === 0) {
      return NextResponse.json(
        { error: "No todos found for the source date" },
        { status: 404 }
      );
    }

    // Filter todos based on copyCompleted flag
    const todosToCreate = copyCompleted
      ? sourceTodos
      : sourceTodos.filter((todo) => !todo.completed);

    if (todosToCreate.length === 0) {
      return NextResponse.json(
        {
          error:
            "No todos to copy (all are completed and copyCompleted is false)",
        },
        { status: 400 }
      );
    }

    // Get starting order number for destination date
    let orderNum = await getNextOrderNum(toDate);

    // Create new todos for destination date
    const createdTodos = await withRetry(async () => {
      return await prisma.$transaction(
        todosToCreate.map((todo) =>
          prisma.todo.create({
            data: {
              content: todo.content,
              date: toDate,
              orderNum: orderNum++,
              completed: false, // Always create as incomplete
              completedAt: null,
            },
          })
        )
      );
    });

    return NextResponse.json({
      success: true,
      copiedCount: createdTodos.length,
      todos: createdTodos,
    });
  } catch (error) {
    console.error("Error copying todos:", error);
    return NextResponse.json(
      { error: "Failed to copy todos" },
      { status: 500 }
    );
  }
}
