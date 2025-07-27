/**
 * Complete application workflow integration test
 * Tests the entire flow from todo creation to export
 */

import { NextRequest } from "next/server";
import { GET as getTodos, POST as createTodo } from "@/app/api/todos/route";
import { PUT as updateTodo } from "@/app/api/todos/[id]/route";
import { GET as exportTodos } from "@/app/api/todos/export/[date]/route";
import { GET as getTodoCounts } from "@/app/api/todos/counts/route";

// Mock database utilities
jest.mock("@/lib/db-utils", () => ({
  getTodosByDate: jest.fn(),
  getNextOrderNum: jest.fn(),
  getTodoCountsByDate: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    todo: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockDbUtils = jest.requireMock("@/lib/db-utils");
const mockPrisma = jest.requireMock("@/lib/db").prisma;

describe("Complete Application Workflow", () => {
  const testDate = "2025-07-26";
  interface TestTodo {
    id: number;
    content: string;
    completed: boolean;
    orderNum: number;
    date: string;
    createdAt: string;
    completedAt: string | null;
  }

  let createdTodos: TestTodo[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    createdTodos = [];
  });

  it("completes full workflow: create → update → export", async () => {
    // Step 1: Create multiple todos
    console.log("🚀 Step 1: Creating todos...");

    const todosToCreate = [
      "Complete project documentation",
      "Review code changes",
      "Deploy to production",
      "Update team on progress",
    ];

    for (let i = 0; i < todosToCreate.length; i++) {
      const content = todosToCreate[i];
      const newTodo = {
        id: i + 1,
        content,
        completed: false,
        orderNum: i + 1,
        date: testDate,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      mockDbUtils.getNextOrderNum.mockResolvedValueOnce(i + 1);
      mockPrisma.todo.create.mockResolvedValueOnce(newTodo);

      const request = new NextRequest("http://localhost:3000/api/todos", {
        method: "POST",
        body: JSON.stringify({ content, date: testDate }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await createTodo(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      createdTodos.push(data);
    }

    console.log(`✅ Created ${createdTodos.length} todos`);

    // Step 2: Fetch todos to verify creation
    console.log("📋 Step 2: Fetching todos...");

    mockDbUtils.getTodosByDate.mockResolvedValue(createdTodos);

    const fetchRequest = new NextRequest(
      `http://localhost:3000/api/todos?date=${testDate}`
    );
    const fetchResponse = await getTodos(fetchRequest);

    expect(fetchResponse.status).toBe(200);
    const fetchedTodos = await fetchResponse.json();
    expect(fetchedTodos).toHaveLength(4);

    console.log(`✅ Fetched ${fetchedTodos.length} todos`);

    // Step 3: Update some todos (mark as completed)
    console.log("✏️ Step 3: Updating todos...");

    const todosToComplete = [0, 2]; // Complete first and third todos

    for (const index of todosToComplete) {
      const todo = createdTodos[index];
      const updatedTodo = {
        ...todo,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      mockPrisma.todo.update.mockResolvedValueOnce(updatedTodo);

      const updateRequest = new NextRequest(
        `http://localhost:3000/api/todos/${todo.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ completed: true }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const updateResponse = await updateTodo(updateRequest, {
        params: Promise.resolve({ id: todo.id.toString() }),
      });
      expect(updateResponse.status).toBe(200);

      const updatedData = await updateResponse.json();
      expect(updatedData.completed).toBe(true);

      // Update our local copy
      createdTodos[index] = updatedData;
    }

    console.log(`✅ Completed ${todosToComplete.length} todos`);

    // Step 4: Get todo counts
    console.log("📊 Step 4: Getting todo counts...");

    mockDbUtils.getTodoCountsByDate.mockResolvedValue([
      {
        date: testDate,
        total: 4,
        completed: 2,
        pending: 2,
      },
    ]);

    const countsRequest = new NextRequest(
      "http://localhost:3000/api/todos/counts"
    );
    const countsResponse = await getTodoCounts(countsRequest);

    expect(countsResponse.status).toBe(200);
    const counts = await countsResponse.json();
    expect(counts[0]).toMatchObject({
      date: testDate,
      total: 4,
      completed: 2,
      pending: 2,
    });

    console.log("✅ Todo counts verified");

    // Step 5: Export todos as markdown
    console.log("📄 Step 5: Exporting todos...");

    mockDbUtils.getTodosByDate.mockResolvedValue(createdTodos);

    const exportRequest = new NextRequest(
      `http://localhost:3000/api/todos/export/${testDate}`
    );
    const exportResponse = await exportTodos(exportRequest, {
      params: Promise.resolve({ date: testDate }),
    });

    expect(exportResponse.status).toBe(200);

    const exportedContent = await exportResponse.text();

    // Verify markdown content structure
    expect(exportedContent).toContain(`# Todo List - ${testDate}`);
    expect(exportedContent).toContain("## Statistics");
    expect(exportedContent).toContain("**Total Tasks:** 4");
    expect(exportedContent).toContain("**Completed:** 2");
    expect(exportedContent).toContain("**Pending:** 2");
    expect(exportedContent).toContain("## Pending Tasks (2)");
    expect(exportedContent).toContain("## Completed Tasks (2)");

    // Verify specific todo content
    expect(exportedContent).toContain("Complete project documentation");
    expect(exportedContent).toContain("Review code changes");
    expect(exportedContent).toContain("Deploy to production");
    expect(exportedContent).toContain("Update team on progress");

    console.log("✅ Export completed successfully");

    // Step 6: Verify export headers
    const contentDisposition = exportResponse.headers.get(
      "content-disposition"
    );
    expect(contentDisposition).toContain(`todos-${testDate}.md`);
    expect(exportResponse.headers.get("content-type")).toContain(
      "text/markdown"
    );

    console.log("🎉 Complete workflow test passed!");
  });

  it("handles workflow with no todos gracefully", async () => {
    console.log("🔍 Testing empty state workflow...");

    // Try to fetch todos for a date with no todos
    mockDbUtils.getTodosByDate.mockResolvedValue([]);

    const fetchRequest = new NextRequest(
      `http://localhost:3000/api/todos?date=${testDate}`
    );
    const fetchResponse = await getTodos(fetchRequest);

    expect(fetchResponse.status).toBe(200);
    const todos = await fetchResponse.json();
    expect(todos).toHaveLength(0);

    // Try to export with no todos
    const exportRequest = new NextRequest(
      `http://localhost:3000/api/todos/export/${testDate}`
    );
    const exportResponse = await exportTodos(exportRequest, {
      params: Promise.resolve({ date: testDate }),
    });

    expect(exportResponse.status).toBe(404);
    const errorData = await exportResponse.json();
    expect(errorData.error).toBe("No todos found for this date");

    console.log("✅ Empty state handled correctly");
  });

  it("validates data consistency throughout workflow", async () => {
    console.log("🔍 Testing data consistency...");

    // Create a todo with specific content
    const todoContent = "Test data consistency";
    const newTodo = {
      id: 1,
      content: todoContent,
      completed: false,
      orderNum: 1,
      date: testDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    mockDbUtils.getNextOrderNum.mockResolvedValue(1);
    mockPrisma.todo.create.mockResolvedValue(newTodo);

    // Create todo
    const createRequest = new NextRequest("http://localhost:3000/api/todos", {
      method: "POST",
      body: JSON.stringify({ content: todoContent, date: testDate }),
      headers: { "Content-Type": "application/json" },
    });

    const createResponse = await createTodo(createRequest);
    const createdTodo = await createResponse.json();

    // Verify created todo data
    expect(createdTodo.content).toBe(todoContent);
    expect(createdTodo.date).toBe(testDate);
    expect(createdTodo.completed).toBe(false);
    expect(createdTodo.completedAt).toBe(null);

    // Update todo
    const updatedTodo = {
      ...createdTodo,
      content: "Updated: " + todoContent,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    mockPrisma.todo.update.mockResolvedValue(updatedTodo);

    const updateRequest = new NextRequest(
      `http://localhost:3000/api/todos/${createdTodo.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          content: "Updated: " + todoContent,
          completed: true,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const updateResponse = await updateTodo(updateRequest, {
      params: Promise.resolve({ id: createdTodo.id.toString() }),
    });
    const updatedData = await updateResponse.json();

    // Verify updated data consistency
    expect(updatedData.content).toBe("Updated: " + todoContent);
    expect(updatedData.completed).toBe(true);
    expect(updatedData.completedAt).toBeTruthy();
    expect(updatedData.id).toBe(createdTodo.id);
    expect(updatedData.date).toBe(testDate);

    console.log("✅ Data consistency verified");
  });

  it("tests error recovery in workflow", async () => {
    console.log("🚨 Testing error recovery...");

    // Test creation with invalid data
    const invalidRequest = new NextRequest("http://localhost:3000/api/todos", {
      method: "POST",
      body: JSON.stringify({ content: "", date: testDate }),
      headers: { "Content-Type": "application/json" },
    });

    const invalidResponse = await createTodo(invalidRequest);
    expect(invalidResponse.status).toBe(400);

    const errorData = await invalidResponse.json();
    expect(errorData.error).toBe("Content cannot be empty");

    // Test update with invalid ID
    const invalidUpdateRequest = new NextRequest(
      "http://localhost:3000/api/todos/invalid",
      {
        method: "PUT",
        body: JSON.stringify({ content: "Updated content" }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const invalidUpdateResponse = await updateTodo(invalidUpdateRequest, {
      params: Promise.resolve({ id: "invalid" }),
    });
    expect(invalidUpdateResponse.status).toBe(400);

    // Test fetch with invalid date
    const invalidFetchRequest = new NextRequest(
      "http://localhost:3000/api/todos?date=invalid-date"
    );
    const invalidFetchResponse = await getTodos(invalidFetchRequest);
    expect(invalidFetchResponse.status).toBe(400);

    console.log("✅ Error recovery tested");
  });
});
