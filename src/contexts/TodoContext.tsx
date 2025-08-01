"use client";

import { createContext, useContext, ReactNode } from "react";
import { useDateNavigation } from "@/hooks/useDateNavigation";

import { TodoCounts } from "@/lib/types";

interface TodoContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  todoCounts: TodoCounts;
  refreshTodoCounts: () => Promise<void>;
  availableDates: string[];
  navigateToDate: (date: string) => void;
  navigateToToday: () => void;
  navigateToPrevious: () => void;
  navigateToNext: () => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: ReactNode }) {
  const dateNavigation = useDateNavigation();

  return (
    <TodoContext.Provider
      value={{
        currentDate: dateNavigation.currentDate,
        setCurrentDate: dateNavigation.setCurrentDate,
        sidebarCollapsed: dateNavigation.sidebarCollapsed,
        setSidebarCollapsed: dateNavigation.setSidebarCollapsed,
        todoCounts: dateNavigation.todoCounts,
        refreshTodoCounts: dateNavigation.refreshTodoCounts,
        availableDates: dateNavigation.availableDates,
        navigateToDate: dateNavigation.navigateToDate,
        navigateToToday: dateNavigation.navigateToToday,
        navigateToPrevious: dateNavigation.navigateToPrevious,
        navigateToNext: dateNavigation.navigateToNext,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodoContext() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error("useTodoContext must be used within a TodoProvider");
  }
  return context;
}
