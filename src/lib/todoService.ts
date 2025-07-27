import { prisma } from "./database";
import { Todo, TodoCounts } from "./types";

export class TodoService {
  // Get todos for a specific date
  static async getTodosForDate(date: string): Promise<Todo[]> {
    try {
      const todos = await prisma.todo.findMany({
        where: { date },
        orderBy: [{ orderNum: "asc" }, { id: "asc" }],
      });

      return todos.map((todo) => ({
        id: todo.id,
        content: todo.content,
        completed: todo.completed,
        orderNum: todo.orderNum,
        date: todo.date,
        createdAt: todo.createdAt.toISOString(),
        completedAt: todo.completedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching todos for date:", error);
      throw new Error("Failed to fetch todos");
    }
  }

  // Add a new todo
  static async addTodo(
    date: string,
    content: string,
    orderNum?: number
  ): Promise<Todo> {
    try {
      // If no order specified, get the max order + 1
      if (orderNum === undefined) {
        const maxOrder = await prisma.todo.aggregate({
          where: { date },
          _max: { orderNum: true },
        });
        orderNum = (maxOrder._max.orderNum || 0) + 1;
      }

      const todo = await prisma.todo.create({
        data: {
          content: content.trim(),
          date,
          orderNum,
          completed: false,
        },
      });

      return {
        id: todo.id,
        content: todo.content,
        completed: todo.completed,
        orderNum: todo.orderNum,
        date: todo.date,
        createdAt: todo.createdAt.toISOString(),
        completedAt: todo.completedAt?.toISOString(),
      };
    } catch (error) {
      console.error("Error adding todo:", error);
      throw new Error("Failed to add todo");
    }
  }

  // Update a todo
  static async updateTodo(
    id: number,
    updates: Partial<Pick<Todo, "content" | "completed" | "orderNum">>
  ): Promise<Todo | null> {
    try {
      const updateData: {
        content?: string;
        completed?: boolean;
        completedAt?: Date | null;
        orderNum?: number;
      } = {};

      if (updates.content !== undefined) {
        updateData.content = updates.content.trim();
      }

      if (updates.completed !== undefined) {
        updateData.completed = updates.completed;
        updateData.completedAt = updates.completed ? new Date() : null;
      }

      if (updates.orderNum !== undefined) {
        updateData.orderNum = updates.orderNum;
      }

      const todo = await prisma.todo.update({
        where: { id },
        data: updateData,
      });

      return {
        id: todo.id,
        content: todo.content,
        completed: todo.completed,
        orderNum: todo.orderNum,
        date: todo.date,
        createdAt: todo.createdAt.toISOString(),
        completedAt: todo.completedAt?.toISOString(),
      };
    } catch (error) {
      console.error("Error updating todo:", error);
      return null;
    }
  }

  // Delete a todo
  static async deleteTodo(id: number): Promise<boolean> {
    try {
      await prisma.todo.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting todo:", error);
      return false;
    }
  }

  // Get todo counts by date
  static async getTodoCounts(): Promise<TodoCounts> {
    try {
      // Get total counts by date
      const totalCounts = await prisma.todo.groupBy({
        by: ["date"],
        _count: {
          id: true,
        },
        orderBy: {
          date: "desc",
        },
      });

      // Get completed counts by date
      const completedCounts = await prisma.todo.groupBy({
        by: ["date"],
        where: {
          completed: true,
        },
        _count: {
          id: true,
        },
      });

      // Get date aliases
      const aliases = await prisma.dateAlias.findMany();
      const aliasMap = aliases.reduce((acc, alias) => {
        acc[alias.date] = alias.alias;
        return acc;
      }, {} as Record<string, string>);

      const result: TodoCounts = {};

      totalCounts.forEach((count) => {
        const completedCount =
          completedCounts.find((c) => c.date === count.date)?._count.id || 0;
        const total = count._count.id;
        const pending = total - completedCount;

        result[count.date] = {
          total,
          completed: completedCount,
          pending,
          alias: aliasMap[count.date],
        };
      });

      return result;
    } catch (error) {
      console.error("Error getting todo counts:", error);
      throw new Error("Failed to get todo counts");
    }
  }

  // Delete all todos for a specific date
  static async deleteAllTodosForDate(date: string): Promise<number> {
    try {
      const result = await prisma.todo.deleteMany({
        where: { date },
      });
      return result.count;
    } catch (error) {
      console.error("Error deleting todos for date:", error);
      throw new Error("Failed to delete todos for date");
    }
  }

  // Copy all todos from one date to another
  static async copyTodosToDate(
    sourceDate: string,
    targetDate: string
  ): Promise<number> {
    try {
      const sourceTodos = await prisma.todo.findMany({
        where: { date: sourceDate },
        orderBy: { orderNum: "asc" },
      });

      if (sourceTodos.length === 0) {
        return 0;
      }

      const newTodos = sourceTodos.map((todo, index) => ({
        content: todo.content,
        date: targetDate,
        orderNum: index + 1,
        completed: false, // Reset completion status for copied todos
      }));

      await prisma.todo.createMany({
        data: newTodos,
      });

      return newTodos.length;
    } catch (error) {
      console.error("Error copying todos:", error);
      throw new Error("Failed to copy todos");
    }
  }

  // Search todos across all dates
  static async searchTodos(searchTerm: string): Promise<Todo[]> {
    try {
      const todos = await prisma.todo.findMany({
        where: {
          content: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        orderBy: [{ date: "desc" }, { orderNum: "asc" }],
      });

      return todos.map((todo) => ({
        id: todo.id,
        content: todo.content,
        completed: todo.completed,
        orderNum: todo.orderNum,
        date: todo.date,
        createdAt: todo.createdAt.toISOString(),
        completedAt: todo.completedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error searching todos:", error);
      throw new Error("Failed to search todos");
    }
  }
}

export class DateAliasService {
  // Get all date aliases
  static async getAllAliases(): Promise<Record<string, string>> {
    try {
      const aliases = await prisma.dateAlias.findMany();
      const result: Record<string, string> = {};
      aliases.forEach((alias) => {
        result[alias.date] = alias.alias;
      });
      return result;
    } catch (error) {
      console.error("Error getting date aliases:", error);
      return {};
    }
  }

  // Set or update a date alias
  static async setAlias(date: string, alias: string): Promise<boolean> {
    try {
      await prisma.dateAlias.upsert({
        where: { date },
        update: { alias },
        create: { date, alias },
      });
      return true;
    } catch (error) {
      console.error("Error setting date alias:", error);
      return false;
    }
  }

  // Delete a date alias
  static async deleteAlias(date: string): Promise<boolean> {
    try {
      await prisma.dateAlias.delete({
        where: { date },
      });
      return true;
    } catch (error) {
      console.error("Error deleting date alias:", error);
      return false;
    }
  }
}
