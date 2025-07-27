import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRetry } from "@/lib/db-error-handler";

// PUT /api/todos/[id] - Update a todo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const body = await request.json();
    const { content, completed } = body;

    // Validate input
    if (content !== undefined) {
      if (typeof content !== "string") {
        return NextResponse.json(
          { error: "Content must be a string" },
          { status: 400 }
        );
      }

      if (content.trim().length === 0) {
        return NextResponse.json(
          { error: "Content cannot be empty" },
          { status: 400 }
        );
      }

      if (content.length > 1000) {
        return NextResponse.json(
          { error: "Content too long (max 1000 characters)" },
          { status: 400 }
        );
      }
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Completed must be a boolean" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      content?: string;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }

    const todo = await withRetry(async () => {
      return await prisma.todo.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json(todo);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record not found")) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    await withRetry(async () => {
      return await prisma.todo.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record not found")) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
