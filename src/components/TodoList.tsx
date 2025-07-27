"use client";

import { useState, useRef, useEffect } from "react";
import TodoItem from "./TodoItem";
import ExportButton from "./ExportButton";
import AutoResizeTextarea from "./AutoResizeTextarea";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { useTodos } from "@/hooks/useTodos";
import { useTodoContext } from "@/contexts/TodoContext";
import styles from "./TodoList.module.css";

export interface Todo {
  id: number;
  content: string;
  completed: boolean;
  orderNum: number;
  date: string;
  createdAt: string;
  completedAt: string | null;
}

interface TodoListProps {
  selectedDate: string;
  onTodoUpdate?: () => void;
}

export default function TodoList({
  selectedDate,
  onTodoUpdate,
}: TodoListProps) {
  const { refreshTodoCounts } = useTodoContext();
  const { todos, loading, error, addTodo, updateTodo, deleteTodo, clearError } =
    useTodos(selectedDate);

  const [newTodoContent, setNewTodoContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newTodoInputRef = useRef<HTMLTextAreaElement>(null);

  // Add new todo using the hook
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTodoContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addTodo(newTodoContent.trim(), selectedDate);
      setNewTodoContent("");
      onTodoUpdate?.();
      refreshTodoCounts(); // Update sidebar counts
    } catch {
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle todo update using the hook
  const handleTodoUpdate = async (id: number, updates: Partial<Todo>) => {
    try {
      await updateTodo(id, updates);
      onTodoUpdate?.();
      refreshTodoCounts(); // Update sidebar counts
    } catch {
      // Error is already handled by the hook
    }
  };

  // Handle todo deletion using the hook
  const handleTodoDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      onTodoUpdate?.();
      refreshTodoCounts(); // Update sidebar counts
    } catch {
      // Error is already handled by the hook
    }
  };

  // Handle keyboard shortcuts for new todo input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo(e as React.FormEvent);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setNewTodoContent("");
      newTodoInputRef.current?.blur();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus new todo input with Ctrl+N or Cmd+N
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        newTodoInputRef.current?.focus();
      }

      // Focus new todo input with just 'n' when no input is focused
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (
          !activeElement ||
          (activeElement.tagName !== "INPUT" &&
            activeElement.tagName !== "TEXTAREA")
        ) {
          e.preventDefault();
          newTodoInputRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" text="Loading todos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage error={error} onRetry={clearError} variant="inline" />
      </div>
    );
  }

  return (
    <div className={styles.todoList}>
      <form onSubmit={handleAddTodo} className={styles.addTodoForm}>
        <AutoResizeTextarea
          ref={newTodoInputRef}
          value={newTodoContent}
          onChange={(e) => setNewTodoContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new todo..."
          className={styles.newTodoInput}
          disabled={isSubmitting}
          minRows={1}
          maxRows={5}
        />
        <button
          type="submit"
          disabled={!newTodoContent.trim() || isSubmitting}
          className={styles.addButton}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </form>

      <div className={styles.toolbar}>
        <ExportButton date={selectedDate} disabled={todos.length === 0} />
      </div>

      <div className={styles.todos}>
        {todos.length === 0 ? (
          <div className={styles.emptyState}>
            No todos for this date. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={handleTodoUpdate}
              onDelete={handleTodoDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
