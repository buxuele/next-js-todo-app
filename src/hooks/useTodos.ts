"use client";

import { useState, useEffect, useCallback } from "react";
import { useRetry } from "./useRetry";

export interface Todo {
  id: number;
  content: string;
  completed: boolean;
  orderNum: number;
  date: string;
  createdAt: string;
  completedAt: string | null;
}

interface UseTodosReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  addTodo: (content: string, date: string) => Promise<void>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  refreshTodos: () => Promise<void>;
  clearError: () => void;
}

export function useTodos(selectedDate: string): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use retry hook for network operations
  const { execute: executeWithRetry } = useRetry({
    maxRetries: 2,
    retryDelay: 1000,
    backoffMultiplier: 1.5,
  });

  // Fetch todos for the selected date
  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = (await executeWithRetry(async () => {
        const response = await fetch(`/api/todos?date=${selectedDate}`);

        if (!response.ok) {
          throw new Error("Failed to fetch todos");
        }

        return await response.json();
      })) as Todo[];

      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, executeWithRetry]);

  // Add a new todo
  const addTodo = useCallback(
    async (content: string, date: string) => {
      try {
        setError(null);

        const newTodo = (await executeWithRetry(async () => {
          const response = await fetch("/api/todos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: content.trim(),
              date,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create todo");
          }

          return await response.json();
        })) as Todo;

        setTodos((prev) => [newTodo, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create todo");
        throw err; // Re-throw to allow component to handle it
      }
    },
    [executeWithRetry]
  );

  // Update an existing todo
  const updateTodo = useCallback(
    async (id: number, updates: Partial<Todo>) => {
      try {
        setError(null);

        const updatedTodo = (await executeWithRetry(async () => {
          const response = await fetch(`/api/todos/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update todo");
          }

          return await response.json();
        })) as Todo;

        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? updatedTodo : todo))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update todo");
        throw err;
      }
    },
    [executeWithRetry]
  );

  // Delete a todo
  const deleteTodo = useCallback(
    async (id: number) => {
      try {
        setError(null);

        await executeWithRetry(async () => {
          const response = await fetch(`/api/todos/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete todo");
          }

          return response;
        });

        setTodos((prev) => prev.filter((todo) => todo.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete todo");
        throw err;
      }
    },
    [executeWithRetry]
  );

  // Refresh todos (useful for manual refresh)
  const refreshTodos = useCallback(async () => {
    await fetchTodos();
  }, [fetchTodos]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch todos when selectedDate changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    refreshTodos,
    clearError,
  };
}
