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

    // Generate filename in Flask format (MM.DD-todo.md)
    let filename;
    if (dateRegex.test(date)) {
      // For regular dates, use MM.DD format
      const dateObj = new Date(date + "T00:00:00");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      filename = `${month}.${day}-todo.md`;
    } else {
      // For copy identifiers, use the display name
      filename = `${displayDate.replace(/\s+/g, "")}-todo.md`;
    }

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
  // Format exactly like Flask app
  let content = `# ${displayDate} Todo\n\n`;

  if (pendingTodos.length === 0 && completedTodos.length === 0) {
    content += "今日无任务\n";
  } else {
    if (pendingTodos.length > 0) {
      content += "## 待完成\n\n";
      for (const todo of pendingTodos) {
        content += `- [ ] ${todo.content}\n`;
      }
      content += "\n";
    }

    if (completedTodos.length > 0) {
      content += "## 已完成\n\n";
      for (const todo of completedTodos) {
        content += `- [x] ${todo.content}\n`;
      }
      content += "\n";
    }

    const totalTodos = completedTodos.length + pendingTodos.length;
    content += `---\n总计: ${totalTodos} 项任务，已完成: ${completedTodos.length} 项\n`;
  }

  // Add creation timestamp like Flask app
  content += `\n---\n创建时间: ${new Date()
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-")}\n`;

  return content;
}
