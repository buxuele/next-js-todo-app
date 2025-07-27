"use client";

import { useState } from "react";
import styles from "./SearchResults.module.css";
import { Todo } from "./TodoList";

interface SearchResultsProps {
  results: Todo[];
  query: string;
  isSearching: boolean;
  onResultClick?: (todo: Todo) => void;
}

export default function SearchResults({
  results,
  query,
  isSearching,
  onResultClick,
}: SearchResultsProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = async (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(todo.content);
      setCopiedId(todo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isSearching) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.searchingState}>
          <div className={styles.spinner} />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.emptyState}>
          <div className={styles.searchIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h3>Search your todos</h3>
          <p>Enter a search term to find todos across all dates</p>
          <div className={styles.searchTip}>
            <strong>Tip:</strong> Use Ctrl+F (Cmd+F on Mac) to quickly focus the
            search bar
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.searchResults}>
        <div className={styles.noResults}>
          <div className={styles.noResultsIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <h3>No results found</h3>
          <p>No todos found matching &ldquo;{query}&rdquo;</p>
          <div className={styles.searchSuggestions}>
            <strong>Try:</strong>
            <ul>
              <li>Using different keywords</li>
              <li>Checking for typos</li>
              <li>Using shorter search terms</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchResults}>
      <div className={styles.resultsHeader}>
        <h3>Search Results</h3>
        <span className={styles.resultCount}>
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;
          {query}&rdquo;
        </span>
      </div>

      <div className={styles.resultsList}>
        {results.map((todo) => (
          <div
            key={todo.id}
            className={`${styles.resultItem} ${
              todo.completed ? styles.completed : ""
            }`}
            onClick={() => onResultClick?.(todo)}
          >
            <div className={styles.resultContent}>
              <div className={styles.todoText}>
                {highlightText(todo.content, query)}
              </div>

              <div className={styles.resultMeta}>
                <span className={styles.resultDate}>
                  {formatDate(todo.date)}
                </span>
                <span className={styles.resultTime}>
                  {formatTime(todo.createdAt)}
                </span>
                {todo.completed && (
                  <span className={styles.completedBadge}>✓ Completed</span>
                )}
              </div>
            </div>

            <div className={styles.resultActions}>
              <button
                onClick={(e) => handleCopyToClipboard(todo, e)}
                className={styles.copyButton}
                title="Copy to clipboard"
              >
                {copiedId === todo.id ? "✓" : "📋"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
