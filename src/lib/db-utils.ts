import { prisma } from "./db";
import { handleDatabaseError, withRetry } from "./db-error-handler";

export interface TodoWithCounts {
  id: number;
  content: string;
  completed: boolean;
  orderNum: number;
  date: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface DateCount {
  date: string;
  total: number;
  completed: number;
  pending: number;
  alias?: string;
}

// Get todos for a specific date
export async function getTodosByDate(date: string): Promise<TodoWithCounts[]> {
  try {
    return await withRetry(async () => {
      return await prisma.todo.findMany({
        where: { date },
        orderBy: [
          { completed: "asc" },
          { orderNum: "desc" },
          { createdAt: "desc" },
        ],
      });
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

// Get todo counts by date
export async function getTodoCountsByDate(): Promise<DateCount[]> {
  try {
    return await withRetry(async () => {
      const [todosByDate, aliases] = await Promise.all([
        prisma.todo.findMany({
          select: {
            date: true,
            completed: true,
          },
        }),
        prisma.dateAlias.findMany(),
      ]);

      const aliasMap = new Map(
        aliases.map((alias) => [alias.date, alias.alias])
      );

      // Group todos by date and count completed/pending
      const dateCountsMap = new Map<
        string,
        { total: number; completed: number }
      >();

      todosByDate.forEach((todo) => {
        const existing = dateCountsMap.get(todo.date) || {
          total: 0,
          completed: 0,
        };
        existing.total++;
        if (todo.completed) {
          existing.completed++;
        }
        dateCountsMap.set(todo.date, existing);
      });

      // Convert to array and sort by date descending
      return Array.from(dateCountsMap.entries())
        .map(([date, counts]) => ({
          date,
          total: counts.total,
          completed: counts.completed,
          pending: counts.total - counts.completed,
          alias: aliasMap.get(date),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

// Get all unique dates with todos
export async function getAllDatesWithTodos(): Promise<string[]> {
  try {
    return await withRetry(async () => {
      const result = await prisma.todo.findMany({
        select: { date: true },
        distinct: ["date"],
        orderBy: { date: "desc" },
      });
      return result.map((r) => r.date);
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

// Search todos across all dates
export async function searchTodos(query: string): Promise<TodoWithCounts[]> {
  try {
    return await withRetry(async () => {
      return await prisma.todo.findMany({
        where: {
          content: {
            contains: query,
            mode: "insensitive",
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

// Get next order number for a date
export async function getNextOrderNum(date: string): Promise<number> {
  try {
    return await withRetry(async () => {
      const maxOrder = await prisma.todo.aggregate({
        where: { date },
        _max: { orderNum: true },
      });
      return (maxOrder._max.orderNum || 0) + 1;
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
