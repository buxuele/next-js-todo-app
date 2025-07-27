"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AutoResizeTextarea from "./AutoResizeTextarea";
import styles from "./TodoItem.module.css";
import { Todo } from "./TodoList";

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: number, updates: Partial<Todo>) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality is now handled by AutoResizeTextarea component

  // Handle double-click to toggle completion
  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      onUpdate(todo.id, { completed: !todo.completed });
    }
  }, [isEditing, onUpdate, todo.id, todo.completed]);

  // Handle single click to start editing
  const handleClick = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
      setEditContent(todo.content);
    }
  }, [isEditing, todo.content]);

  // Handle save edit
  const handleSaveEdit = () => {
    const trimmedContent = editContent.trim();
    if (trimmedContent && trimmedContent !== todo.content) {
      onUpdate(todo.id, { content: trimmedContent });
    }
    setIsEditing(false);
    setEditContent(todo.content);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(todo.content);
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(todo.content);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    },
    [todo.content]
  );

  // Handle delete
  const handleDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this todo?")) {
        onDelete(todo.id);
      }
    },
    [onDelete, todo.id]
  );

  // Handle keyboard shortcuts in edit mode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === "Tab") {
      // Allow tab for indentation in multi-line todos
      // Default behavior is fine
    }
  };

  // Global keyboard shortcuts for this todo item
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when this todo is focused or being edited
      const isThisTodoFocused = document.activeElement === textareaRef.current;

      if (isThisTodoFocused && !isEditing) {
        // Press 'e' to start editing
        if (e.key === "e" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handleClick();
        }
        // Press 'c' to copy to clipboard
        else if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const mockEvent = {
            stopPropagation: () => {},
          } as React.MouseEvent<HTMLButtonElement>;
          handleCopyToClipboard(mockEvent);
        }
        // Press 'd' to delete
        else if (e.key === "d" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const mockEvent = {
            stopPropagation: () => {},
          } as React.MouseEvent<HTMLButtonElement>;
          handleDelete(mockEvent);
        }
        // Press space to toggle completion
        else if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          handleDoubleClick();
        }
      }
    };

    if (isEditing) {
      document.addEventListener("keydown", handleGlobalKeyDown);
      return () => document.removeEventListener("keydown", handleGlobalKeyDown);
    }
  }, [
    isEditing,
    handleClick,
    handleCopyToClipboard,
    handleDelete,
    handleDoubleClick,
  ]);

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`${styles.todoItem} ${todo.completed ? styles.completed : ""}`}
      onDoubleClick={handleDoubleClick}
    >
      <div className={styles.todoContent}>
        {isEditing ? (
          <AutoResizeTextarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className={styles.editTextarea}
            minRows={1}
            maxRows={8}
          />
        ) : (
          <div className={styles.todoText} onClick={handleClick}>
            {todo.content}
          </div>
        )}
      </div>

      <div className={styles.todoActions}>
        <button
          onClick={handleCopyToClipboard}
          className={styles.copyButton}
          title="Copy to clipboard"
        >
          📋
        </button>

        <button
          onClick={handleDelete}
          className={styles.deleteButton}
          title="Delete todo"
        >
          🗑️
        </button>

        {showCopyFeedback && <div className={styles.copyFeedback}>Copied!</div>}
      </div>

      <div className={styles.todoMeta}>
        <span className={styles.timestamp}>
          {new Date(todo.createdAt).toLocaleTimeString()}
        </span>
        {todo.completed && todo.completedAt && (
          <span className={styles.completedTime}>
            ✓ {new Date(todo.completedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
