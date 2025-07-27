"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentDate } from "@/lib/utils";
import { TodoCounts } from "@/lib/types";

export interface DateCount {
  date: string;
  total: number;
  completed: number;
  pending: number;
  alias?: string;
}

interface UseDateNavigationReturn {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (isSearchMode: boolean) => void;
  todoCounts: TodoCounts;
  refreshTodoCounts: () => Promise<void>;
  availableDates: string[];
  navigateToDate: (date: string) => void;
  navigateToToday: () => void;
  navigateToPrevious: () => void;
  navigateToNext: () => void;
}

export function useDateNavigation(): UseDateNavigationReturn {
  const [currentDate, setCurrentDate] = useState<string>(getCurrentDate());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [todoCounts, setTodoCounts] = useState<TodoCounts>({});

  // Fetch todo counts from API
  const fetchTodoCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/todos/counts");
      if (response.ok) {
        const data: DateCount[] = await response.json();
        // Convert array to object with date keys
        const countsObject: TodoCounts = {};
        data.forEach((count) => {
          countsObject[count.date] = {
            total: count.total,
            completed: count.completed,
            pending: count.pending,
            alias: count.alias,
          };
        });
        setTodoCounts(countsObject);
      }
    } catch (error) {
      console.error("Failed to fetch todo counts:", error);
    }
  }, []);

  // Get available dates (dates with todos + today)
  const availableDates = useCallback(() => {
    const today = getCurrentDate();
    const datesWithTodos = Object.keys(todoCounts);

    // Add today if it's not already in the list
    if (!datesWithTodos.includes(today)) {
      datesWithTodos.push(today);
    }

    // Sort dates in descending order (newest first)
    return datesWithTodos.sort((a, b) => b.localeCompare(a));
  }, [todoCounts])();

  // Navigate to a specific date
  const navigateToDate = useCallback((date: string) => {
    setCurrentDate(date);
    setIsSearchMode(false); // Exit search mode when navigating to a date
  }, []);

  // Navigate to today
  const navigateToToday = useCallback(() => {
    navigateToDate(getCurrentDate());
  }, [navigateToDate]);

  // Navigate to previous date (in available dates list)
  const navigateToPrevious = useCallback(() => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex > 0) {
      navigateToDate(availableDates[currentIndex - 1]);
    }
  }, [availableDates, currentDate, navigateToDate]);

  // Navigate to next date (in available dates list)
  const navigateToNext = useCallback(() => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex < availableDates.length - 1) {
      navigateToDate(availableDates[currentIndex + 1]);
    }
  }, [availableDates, currentDate, navigateToDate]);

  // Refresh todo counts (useful after adding/deleting todos)
  const refreshTodoCounts = useCallback(async () => {
    await fetchTodoCounts();
  }, [fetchTodoCounts]);

  // Fetch todo counts on mount
  useEffect(() => {
    fetchTodoCounts();
  }, [fetchTodoCounts]);

  // Keyboard shortcuts for date navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when no input is focused
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      // Navigate with arrow keys
      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigateToPrevious();
      } else if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigateToNext();
      }
      // Go to today with 't'
      else if (e.key === "t" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigateToToday();
      }
      // Toggle sidebar with 's'
      else if (e.key === "s" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
      // Toggle search mode with '/'
      else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsSearchMode((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateToPrevious, navigateToNext, navigateToToday]);

  return {
    currentDate,
    setCurrentDate: navigateToDate,
    sidebarCollapsed,
    setSidebarCollapsed,
    isSearchMode,
    setIsSearchMode,
    todoCounts,
    refreshTodoCounts,
    availableDates,
    navigateToDate,
    navigateToToday,
    navigateToPrevious,
    navigateToNext,
  };
}
