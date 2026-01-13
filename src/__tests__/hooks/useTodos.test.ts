import { renderHook, waitFor, act } from "@testing-library/react";
import { useTodos } from "@/hooks/useTodos";
import { mockFetch, mockTodos } from "../utils/test-utils";

// Mock the useRetry hook
jest.mock("@/hooks/useRetry", () => ({
  useRetry: () => ({
    execute: jest.fn((fn) => fn()),
  }),
}));

describe("useTodos Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches todos on mount", async () => {
    const todosForDate = mockTodos.filter((todo) => todo.date === "2025-07-26");
    mockFetch({
      "GET /api/todos?date=2025-07-26": todosForDate,
    });

    const { result } = renderHook(() => useTodos("2025-07-26"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.todos).toEqual(todosForDate);
    expect(result.current.error).toBe(null);
  });

  it("handles fetch errors", async () => {
    jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      } as Response)
    );

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch todos");
    expect(result.current.todos).toEqual([]);
  });

  it("refetches todos when date changes", async () => {
    const fetchMock = mockFetch({
      "GET /api/todos?date=2025-07-26": mockTodos.filter(
        (todo) => todo.date === "2025-07-26"
      ),
      "GET /api/todos?date=2025-07-25": mockTodos.filter(
        (todo) => todo.date === "2025-07-25"
      ),
    });

    const { result, rerender } = renderHook(({ date }) => useTodos(date), {
      initialProps: { date: "2025-07-26" },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/todos?date=2025-07-26");

    // Change date
    rerender({ date: "2025-07-25" });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/todos?date=2025-07-25");
    });
  });

  it("adds a new todo", async () => {
    const newTodo = {
      id: 4,
      content: "New todo",
      completed: false,
      orderNum: 4,
      date: "2025-07-26",
      createdAt: "2025-07-26T12:00:00.000Z",
      completedAt: null,
    };

    mockFetch({
      "GET /api/todos?date=2025-07-26": [],
      "POST /api/todos": newTodo,
    });

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTodo("New todo", "2025-07-26");
    });

    expect(result.current.todos).toContainEqual(newTodo);
  });

  it("handles add todo errors", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid content" }),
      } as Response);

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.addTodo("", "2025-07-26")).rejects.toThrow(
        "Invalid content"
      );
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Invalid content");
    });
  });

  it("updates a todo", async () => {
    const initialTodos = [mockTodos[0]];
    const updatedTodo = { ...mockTodos[0], content: "Updated content" };

    mockFetch({
      "GET /api/todos?date=2025-07-26": initialTodos,
      "PUT /api/todos/1": updatedTodo,
    });

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateTodo(1, { content: "Updated content" });
    });

    expect(result.current.todos[0]).toEqual(updatedTodo);
  });

  it("deletes a todo", async () => {
    const initialTodos = [mockTodos[0], mockTodos[1]];

    mockFetch({
      "GET /api/todos?date=2025-07-26": initialTodos,
      "DELETE /api/todos/1": { success: true },
    });

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.todos).toHaveLength(2);

    await act(async () => {
      await result.current.deleteTodo(1);
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos.find((todo) => todo.id === 1)).toBeUndefined();
  });

  it("clears error state", async () => {
    jest.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      } as Response)
    );

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch todos");
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it("refreshes todos", async () => {
    const fetchMock = mockFetch({
      "GET /api/todos?date=2025-07-26": mockTodos.filter(
        (todo) => todo.date === "2025-07-26"
      ),
    });

    const { result } = renderHook(() => useTodos("2025-07-26"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchMock.mockClear();

    await act(async () => {
      await result.current.refreshTodos();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/todos?date=2025-07-26");
  });
});
