"use client";

import { useState, useCallback, useRef } from "react";
import { Todo } from "./useTodos";

interface SearchResponse {
  query: string;
  results: Todo[];
  count: number;
}

interface UseSearchReturn {
  searchResults: Todo[];
  currentQuery: string;
  isSearching: boolean;
  error: string | null;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

export function useSearch(): UseSearchReturn {
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Perform search with debouncing
  const performSearch = useCallback(async (query: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If query is empty, clear results immediately
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentQuery("");
      setError(null);
      setIsSearching(false);
      return;
    }

    // Set up debounced search
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        setError(null);
        setCurrentQuery(query);

        const response = await fetch(
          `/api/todos/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Search failed");
        }

        const data: SearchResponse = await response.json();
        setSearchResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce delay
  }, []);

  // Clear search results and state
  const clearSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchResults([]);
    setCurrentQuery("");
    setError(null);
    setIsSearching(false);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchResults,
    currentQuery,
    isSearching,
    error,
    performSearch,
    clearSearch,
    clearError,
  };
}
