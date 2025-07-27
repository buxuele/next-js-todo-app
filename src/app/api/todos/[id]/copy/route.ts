import { NextRequest } from "next/server";
import { TodoService } from "@/lib/todoService";
import {
  handleAPIError,
  createSuccessResponse,
  TodoAppError,
} from "@/lib/errorHandler";
import { validateDateFormat } from "@/lib/utils";

// POST /api/todos/[id]/copy?date=YYYY-MM-DD - Copy todo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      throw new TodoAppError("Date parameter is required", 400);
    }

    if (!validateDateFormat(date)) {
      throw new TodoAppError("Invalid date format. Use YYYY-MM-DD", 400);
    }

    const resolvedParams = await params;
    const todoId = parseInt(resolvedParams.id);
    if (isNaN(todoId)) {
      throw new TodoAppError("Invalid todo ID", 400);
    }

    // Get the original todo
    const todos = await TodoService.getTodosForDate(date);
    const originalTodo = todos.find((t) => t.id === todoId);

    if (!originalTodo) {
      throw new TodoAppError("Todo not found", 404);
    }

    // Create a copy of the todo on the same date
    const newTodo = await TodoService.addTodo(date, originalTodo.content);

    return createSuccessResponse(newTodo, "Todo copied successfully", 201);
  } catch (error) {
    return handleAPIError(error);
  }
}
