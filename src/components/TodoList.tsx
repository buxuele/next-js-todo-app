"use client";

import { useState, useRef, useEffect } from "react";
import TodoItem from "./TodoItem";
import ExportButton from "./ExportButton";
import AutoResizeTextarea from "./AutoResizeTextarea";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { useTodos } from "@/hooks/useTodos";
import { useTodoContext } from "@/contexts/TodoContext";
import { formatDateForDisplay } from "@/lib/utils";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
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

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/todos/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        // API returns { query, results, count }, we need the results array
        const results = data.results || data;
        setSearchResults(results);
        setShowSearchResults(true);
        // Show clear button
        const clearBtn = document.getElementById("clear-search-btn");
        if (clearBtn) clearBtn.style.display = "inline-flex";
      } else {
        console.error("Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    // Hide clear button
    const clearBtn = document.getElementById("clear-search-btn");
    if (clearBtn) clearBtn.style.display = "none";
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
      {/* Header with title, export button, and search - matching Flask layout exactly */}
      <div className={styles.headerSection}>
        <h1 className={styles.headerTitle}>
          {formatDateForDisplay(selectedDate)} Todo
        </h1>
        <div className={styles.headerActions}>
          <ExportButton date={selectedDate} disabled={todos.length === 0} />
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索任务..."
              id="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <button
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "搜索中..." : "搜索"}
            </button>
            <button
              className={styles.clearButton}
              style={{ display: showSearchResults ? "inline-flex" : "none" }}
              id="clear-search-btn"
              onClick={handleClearSearch}
            >
              清除
            </button>
          </div>
        </div>
      </div>

      {/* Add todo form - matching Flask layout */}
      <form onSubmit={handleAddTodo} className={styles.addTodoForm}>
        <AutoResizeTextarea
          ref={newTodoInputRef}
          value={newTodoContent}
          onChange={(e) => setNewTodoContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加新任务 (Shift+Enter换行，Enter提交)"
          className={styles.newTodoInput}
          disabled={isSubmitting}
          minRows={2}
          maxRows={5}
        />
        <button
          type="submit"
          disabled={!newTodoContent.trim() || isSubmitting}
          className={styles.addButton}
        >
          {isSubmitting ? "添加中..." : "添加"}
        </button>
      </form>

      {/* Todo list or search results */}
      <div className={styles.todos}>
        {showSearchResults ? (
          // Show search results
          searchResults.length === 0 ? (
            <div className={styles.emptyState}>
              没有找到包含 &ldquo;{searchQuery}&rdquo; 的任务
            </div>
          ) : (
            <>
              <div className={styles.searchResultsHeader}>
                <h3>搜索结果 ({searchResults.length} 个任务)</h3>
                <p>搜索关键词: &ldquo;{searchQuery}&rdquo;</p>
              </div>
              {searchResults.map((todo) => (
                <div
                  key={`${todo.date}-${todo.id}`}
                  className={styles.searchResultItem}
                >
                  <div className={styles.searchResultMeta}>
                    <span className={styles.searchResultDate}>
                      {formatDateForDisplay(todo.date)}
                    </span>
                    <span className={styles.searchResultTime}>
                      {todo.createdAt
                        ? new Date(todo.createdAt).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <TodoItem
                    todo={todo}
                    onUpdate={handleTodoUpdate}
                    onDelete={handleTodoDelete}
                  />
                </div>
              ))}
            </>
          )
        ) : // Show regular todos for selected date
        todos.length === 0 ? (
          <div className={styles.emptyState}>今日无任务，请在上方添加！</div>
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
