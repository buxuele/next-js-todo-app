import { NextRequest, NextResponse } from "next/server";
import { getTodosByDate } from "@/lib/db-utils";
import { formatDateForDisplay } from "@/lib/utils";

// GET /api/todos/export/[date] - Export todos for a specific date as markdown
export async function GET(
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

    // Get todos for the date
    const todos = await getTodosByDate(date);

    if (todos.length === 0) {
      return NextResponse.json(
        { error: "No todos found for this date" },
        { status: 404 }
      );
    }

    // Separate completed and pending todos
    const completedTodos = todos.filter((todo) => todo.completed);
    const pendingTodos = todos.filter((todo) => !todo.completed);

    // Generate markdown content
    const displayDate = formatDateForDisplay(date);
    const markdown = generateMarkdown(
      displayDate,
      completedTodos,
      pendingTodos
    );

    // Generate filename
    const filename = `todos-${date}.md`;

    // Return markdown as downloadable file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting todos:", error);
    return NextResponse.json(
      { error: "Failed to export todos" },
      { status: 500 }
    );
  }
}

interface Todo {
  id: number;
  content: string;
  completed: boolean;
  createdAt: string | Date;
  completedAt: string | Date | null;
}

function generateMarkdown(
  displayDate: string,
  completedTodos: Todo[],
  pendingTodos: Todo[]
): string {
  const totalTodos = completedTodos.length + pendingTodos.length;
  const completionRate =
    totalTodos > 0 ? Math.round((completedTodos.length / totalTodos) * 100) : 0;

  let markdown = `# Todo List - ${displayDate}\n\n`;

  // Add statistics
  markdown += `## Statistics\n\n`;
  markdown += `- **Total Tasks:** ${totalTodos}\n`;
  markdown += `- **Completed:** ${completedTodos.length}\n`;
  markdown += `- **Pending:** ${pendingTodos.length}\n`;
  markdown += `- **Completion Rate:** ${completionRate}%\n\n`;

  // Add pending todos section
  if (pendingTodos.length > 0) {
    markdown += `## Pending Tasks (${pendingTodos.length})\n\n`;
    pendingTodos.forEach((todo, index) => {
      const time = new Date(todo.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      markdown += `${index + 1}. [ ] ${todo.content} *(${time})*\n`;
    });
    markdown += "\n";
  }

  // Add completed todos section
  if (completedTodos.length > 0) {
    markdown += `## Completed Tasks (${completedTodos.length})\n\n`;
    completedTodos.forEach((todo, index) => {
      const createdTime = new Date(todo.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const completedTime = todo.completedAt
        ? new Date(todo.completedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "Unknown";

      markdown += `${index + 1}. [x] ${
        todo.content
      } *(Created: ${createdTime}, Completed: ${completedTime})*\n`;
    });
    markdown += "\n";
  }

  // Add footer
  markdown += `---\n\n`;
  markdown += `*Exported on ${new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}*\n`;

  return markdown;
}
