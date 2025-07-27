import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/todos/route";
import { PUT, DELETE } from "@/app/api/todos/[id]/route";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    todo: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

jest.mock("@/lib/db-utils", () => ({
  getTodosByDate: jest.fn(),
  getNextOrderNum: jest.fn(),
}));

// Get mocked modules
const mockPrisma = jest.mocked(jest.requireMock("@/lib/db").prisma);
const mockDbUtils = jest.mocked(jest.requireMock("@/lib/db-utils"));

describe("/api/todos API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/todos", () => {
    it("returns todos for a specific date", async () => {
      const mockTodos = [
        {
          id: 1,
          content: "Test todo",
          completed: false,
          orderNum: 1,
          date: "2025-07-26",
          createdAt: new Date(),
          completedAt: null,
        },
      ];

      mockDbUtils.getTodosByDate.mockResolvedValue(mockTodos);

      const request = new NextRequest(
        "http://localhost:3000/api/todos?date=2025-07-26"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTodos);
      expect(mockDbUtils.getTodosByDate).toHaveBeenCalledWith("2025-07-26");
    });

    it("returns 400 for missing date parameter", async () => {
      const request = new NextRequest("http://localhost:3000/api/todos");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Date parameter is required");
    });

    it("returns 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/todos?date=invalid-date"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid date format. Use YYYY-MM-DD");
    });

    it("handles database errors gracefully", async () => {
      mockDbUtils.getTodosByDate.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest(
        "http://localhost:3000/api/todos?date=2025-07-26"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch todos");
    });
  });

  describe("POST /api/todos", () => {
    it("creates a new todo", async () => {
      const newTodo = {
        id: 1,
        content: "New test todo",
        completed: false,
        orderNum: 1,
        date: "2025-07-26",
        createdAt: new Date(),
        completedAt: null,
      };

      mockDbUtils.getNextOrderNum.mockResolvedValue(1);
      mockPrisma.todo.create.mockResolvedValue(newTodo);

      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({
          content: "New test todo",
          date: "2025-07-26",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newTodo);
      expect(mockPrisma.todo.create).toHaveBeenCalledWith({
        data: {
          content: "New test todo",
          date: "2025-07-26",
          orderNum: 1,
          completed: false,
        },
      });
    });

    it("returns 400 for missing content", async () => {
      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({
          date: "2025-07-26",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content and date are required");
    });

    it("returns 400 for empty content", async () => {
      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({
          content: "   ",
          date: "2025-07-26",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content cannot be empty");
    });

    it("returns 400 for content that is too long", async () => {
      const longContent = "a".repeat(1001);

      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({
          content: longContent,
          date: "2025-07-26",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content too long (max 1000 characters)");
    });

    it("returns 400 for invalid date format", async () => {
      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({
          content: "Test todo",
          date: "invalid-date",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid date format. Use YYYY-MM-DD");
    });
  });

  describe("PUT /api/todos/[id]", () => {
    it("updates a todo", async () => {
      const updatedTodo = {
        id: 1,
        content: "Updated todo",
        completed: true,
        orderNum: 1,
        date: "2025-07-26",
        createdAt: new Date(),
        completedAt: new Date(),
      };

      mockPrisma.todo.update.mockResolvedValue(updatedTodo);

      const request = new NextRequest("http://localhost:3000/api/todos/1", {
        method: "PUT",
        body: JSON.stringify({
          content: "Updated todo",
          completed: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedTodo);
      expect(mockPrisma.todo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          content: "Updated todo",
          completed: true,
          completedAt: expect.any(Date),
        },
      });
    });

    it("returns 400 for invalid todo ID", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/todos/invalid",
        {
          method: "PUT",
          body: JSON.stringify({
            content: "Updated todo",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await PUT(request, {
        params: Promise.resolve({ id: "invalid" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid todo ID");
    });

    it("returns 404 for non-existent todo", async () => {
      mockPrisma.todo.update.mockRejectedValue(new Error("Record not found"));

      const request = new NextRequest("http://localhost:3000/api/todos/999", {
        method: "PUT",
        body: JSON.stringify({
          content: "Updated todo",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: "999" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Todo not found");
    });
  });

  describe("DELETE /api/todos/[id]", () => {
    it("deletes a todo", async () => {
      mockPrisma.todo.delete.mockResolvedValue({});

      const request = new NextRequest("http://localhost:3000/api/todos/1", {
        method: "DELETE",
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.todo.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("returns 400 for invalid todo ID", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/todos/invalid",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "invalid" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid todo ID");
    });

    it("returns 404 for non-existent todo", async () => {
      mockPrisma.todo.delete.mockRejectedValue(new Error("Record not found"));

      const request = new NextRequest("http://localhost:3000/api/todos/999", {
        method: "DELETE",
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: "999" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Todo not found");
    });
  });
});
