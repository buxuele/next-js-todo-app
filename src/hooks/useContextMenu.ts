"use client";

import { useState, useCallback } from "react";
import { ContextMenuOption } from "@/components/ContextMenu";

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  data: string | null; // Generic data associated with the context menu
}

interface UseContextMenuReturn {
  contextMenu: ContextMenuState;
  showContextMenu: (e: React.MouseEvent, data?: string) => void;
  hideContextMenu: () => void;
  isVisible: boolean;
}

export function useContextMenu(): UseContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    data: null,
  });

  // Show context menu at mouse position
  const showContextMenu = useCallback((e: React.MouseEvent, data?: string) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      isVisible: true,
      position: { x: e.clientX, y: e.clientY },
      data: data || null,
    });
  }, []);

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    isVisible: contextMenu.isVisible,
  };
}

// Hook for date-specific context menu operations
interface UseDateContextMenuReturn extends UseContextMenuReturn {
  getDateContextMenuOptions: (
    date: string,
    todoCounts: Record<string, { total: number }>
  ) => ContextMenuOption[];
  handleCopyDateList: (fromDate: string) => Promise<void>;
  handleRenameDate: (date: string) => Promise<void>;
  handleDeleteDate: (date: string) => Promise<void>;
}

export function useDateContextMenu(
  onRefresh?: () => void
): UseDateContextMenuReturn {
  const baseContextMenu = useContextMenu();

  // Handle copying todos from one date to another
  const handleCopyDateList = useCallback(
    async (fromDate: string) => {
      const newDate = prompt("Enter the date to copy todos to (YYYY-MM-DD):");
      if (!newDate) return;

      try {
        const response = await fetch("/api/todos/copy-date", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromDate,
            toDate: newDate,
            copyCompleted: false,
          }),
        });

        if (response.ok) {
          alert("Todos copied successfully!");
          onRefresh?.();
        } else {
          const error = await response.json();
          alert(`Failed to copy todos: ${error.error}`);
        }
      } catch {
        alert("Failed to copy todos");
      }
    },
    [onRefresh]
  );

  // Handle renaming a date (creating/updating alias)
  const handleRenameDate = useCallback(
    async (date: string) => {
      const alias = prompt("Enter a new name for this date:");
      if (!alias) return;

      try {
        const response = await fetch("/api/date-aliases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            alias,
          }),
        });

        if (response.ok) {
          alert("Date renamed successfully!");
          onRefresh?.();
        } else {
          const error = await response.json();
          alert(`Failed to rename date: ${error.error}`);
        }
      } catch {
        alert("Failed to rename date");
      }
    },
    [onRefresh]
  );

  // Handle deleting all todos for a date
  const handleDeleteDate = useCallback(
    async (date: string) => {
      const confirmed = confirm(
        `Are you sure you want to delete all todos for ${date}? This action cannot be undone.`
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/todos/date/${date}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Date and all todos deleted successfully!");
          onRefresh?.();
        } else {
          const error = await response.json();
          alert(`Failed to delete date: ${error.error}`);
        }
      } catch {
        alert("Failed to delete date");
      }
    },
    [onRefresh]
  );

  // Get context menu options for a specific date
  const getDateContextMenuOptions = useCallback(
    (
      date: string,
      todoCounts: Record<string, { total: number }>
    ): ContextMenuOption[] => {
      const hasData = todoCounts[date]?.total > 0;

      return [
        {
          id: "copy",
          label: "Copy date list",
          icon: "📋",
          onClick: () => handleCopyDateList(date),
          disabled: !hasData,
        },
        {
          id: "rename",
          label: "Rename date",
          icon: "✏️",
          onClick: () => handleRenameDate(date),
          disabled: !hasData,
        },
        {
          id: "delete",
          label: "Delete date",
          icon: "🗑️",
          onClick: () => handleDeleteDate(date),
          disabled: !hasData,
          destructive: true,
        },
      ];
    },
    [handleCopyDateList, handleRenameDate, handleDeleteDate]
  );

  return {
    ...baseContextMenu,
    getDateContextMenuOptions,
    handleCopyDateList,
    handleRenameDate,
    handleDeleteDate,
  };
}
