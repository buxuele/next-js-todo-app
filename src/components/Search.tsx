"use client";

import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import { useSearch } from "@/hooks/useSearch";
import { Todo } from "./TodoList";
import styles from "./Search.module.css";

interface SearchProps {
  onTodoSelect?: (todo: Todo) => void;
}

export default function Search({ onTodoSelect }: SearchProps) {
  const {
    searchResults,
    currentQuery,
    isSearching,
    error,
    performSearch,
    clearSearch,
  } = useSearch();

  const handleResultClick = (todo: Todo) => {
    onTodoSelect?.(todo);
  };

  return (
    <div className={styles.searchContainer}>
      <SearchBar
        onSearch={performSearch}
        onClear={clearSearch}
        isSearching={isSearching}
      />

      {error && (
        <div className={styles.errorMessage}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Search Error:</strong> {error}
          </div>
          <button
            onClick={() => performSearch(currentQuery)}
            className={styles.retryButton}
          >
            Retry
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
