"use client";

import { useState } from "react";
import SearchResults from "./SearchResults";
import { useSearch } from "@/hooks/useSearch";
import { Todo } from "./TodoList";
import styles from "./Search.module.css";

interface SearchProps {
  onTodoSelect?: (todo: Todo) => void;
}

export default function Search({ onTodoSelect }: SearchProps) {
  const [query, setQuery] = useState("");
  const { searchResults, currentQuery, isSearching, error, performSearch } =
    useSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handleResultClick = (todo: Todo) => {
    onTodoSelect?.(todo);
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchHeader}>
        <h1 className={styles.searchTitle}>搜索 Todos</h1>

        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索任务..."
            className={styles.searchInput}
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={styles.searchButton}
          >
            {isSearching ? "搜索中..." : "搜索"}
          </button>
        </form>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>
            <strong>搜索错误:</strong> {error}
          </div>
          <button
            onClick={() => performSearch(currentQuery)}
            className={styles.retryButton}
          >
            重试
          </button>
        </div>
      )}

      <SearchResults
        results={searchResults}
        query={currentQuery}
        isSearching={isSearching}
        onResultClick={handleResultClick}
      />
    </div>
  );
}
