"use client";

import { useState, useCallback } from "react";
import { ContextMenuOption } from "@/components/ContextMenu";
import { formatDateForDisplay } from "@/lib/utils";

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

  // Handle copying todos from one date to another using unique timestamp-based identifiers
  const handleCopyDateList = useCallback(
    async (fromDate: string) => {
      try {
        // Generate unique timestamp-based identifier like Flask app
        const timestamp = Date.now();
        const today = new Date();
        const datePrefix =
          today.getFullYear() +
          String(today.getMonth() + 1).padStart(2, "0") +
          String(today.getDate()).padStart(2, "0");
        const uniqueId = `copy-${datePrefix}-${timestamp}`;

        // Get current display name for the source date
        const aliasResponse = await fetch("/api/date-aliases");
        const aliases = aliasResponse.ok ? await aliasResponse.json() : {};
        const currentDisplayName =
          aliases[fromDate] || formatDateForDisplay(fromDate);
        const copyName = currentDisplayName + "-copy";

        // Copy todos to unique identifier
        const response = await fetch("/api/todos/copy-date", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_date: fromDate,
            target_date: uniqueId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to copy todos");
        }

        // Set alias for the new unique identifier
        const aliasSetResponse = await fetch("/api/date-aliases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: uniqueId,
            alias: copyName,
          }),
        });

        if (!aliasSetResponse.ok) {
          console.warn("Failed to set alias for copied list");
        }

        alert(`已复制 "${currentDisplayName}" 为 "${copyName}"`);
        onRefresh?.();
      } catch (error) {
        alert(
          `复制失败: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [onRefresh]
  );

  // Handle renaming a date (creating/updating alias)
  const handleRenameDate = useCallback(
    async (date: string) => {
      // Get current display name for the date
      const aliasResponse = await fetch("/api/date-aliases");
      const aliases = aliasResponse.ok ? await aliasResponse.json() : {};
      const currentDisplayName = aliases[date] || formatDateForDisplay(date);

      const alias = prompt(`请输入新的名称:`, currentDisplayName);
      if (!alias || alias.trim() === "") return;

      try {
        const response = await fetch("/api/date-aliases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            alias: alias.trim(),
          }),
        });

        if (response.ok) {
          alert(`已重命名为 "${alias.trim()}"`);
          onRefresh?.();
        } else {
          const error = await response.json();
          alert(`重命名失败: ${error.error}`);
        }
      } catch (error) {
        alert(
          `重命名失败: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [onRefresh]
  );

  // Handle deleting all todos for a date
  const handleDeleteDate = useCallback(
    async (date: string) => {
      // Get current display name for the date
      const aliasResponse = await fetch("/api/date-aliases");
      const aliases = aliasResponse.ok ? await aliasResponse.json() : {};
      const displayName = aliases[date] || formatDateForDisplay(date);

      const confirmed = confirm(
        `确定要删除 "${displayName}" 的所有任务吗？此操作不可恢复！`
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/todos/date/${date}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await response.json();
          alert(`已删除 "${displayName}" 的所有任务`);
          onRefresh?.();
        } else {
          const error = await response.json();
          alert(`删除失败: ${error.error}`);
        }
      } catch (error) {
        alert(
          `删除失败: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [onRefresh]
  );

  // Handle pin/unpin date
  const handleTogglePin = useCallback(
    async (date: string) => {
      try {
        // Get current pinned dates from localStorage
        const pinnedDates = JSON.parse(
          localStorage.getItem("pinnedDates") || "[]"
        );
        const isPinned = pinnedDates.includes(date);

        let updatedPinnedDates;
        if (isPinned) {
          // Unpin
          updatedPinnedDates = pinnedDates.filter((d: string) => d !== date);
          alert(`已取消置顶`);
        } else {
          // Pin
          updatedPinnedDates = [...pinnedDates, date];
          alert(`已置顶`);
        }

        // Save to localStorage
        localStorage.setItem("pinnedDates", JSON.stringify(updatedPinnedDates));
        onRefresh?.();
      } catch (error) {
        alert(
          `操作失败: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
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

      // Check if date is pinned
      const pinnedDates = JSON.parse(
        localStorage.getItem("pinnedDates") || "[]"
      );
      const isPinned = pinnedDates.includes(date);

      return [
        {
          id: "pin",
          label: isPinned ? "取消置顶" : "置顶",
          icon: isPinned ? "📌" : "📍",
          onClick: () => handleTogglePin(date),
          disabled: !hasData,
        },
        {
          id: "copy",
          label: "复制列表",
          icon: "📋",
          onClick: () => handleCopyDateList(date),
          disabled: !hasData,
        },
        {
          id: "rename",
          label: "重命名",
          icon: "✏️",
          onClick: () => handleRenameDate(date),
          disabled: !hasData,
        },
        {
          id: "delete",
          label: "删除列表",
          icon: "🗑️",
          onClick: () => handleDeleteDate(date),
          disabled: !hasData,
          destructive: true,
        },
      ];
    },
    [handleCopyDateList, handleRenameDate, handleDeleteDate, handleTogglePin]
  );

  return {
    ...baseContextMenu,
    getDateContextMenuOptions,
    handleCopyDateList,
    handleRenameDate,
    handleDeleteDate,
  };
}
