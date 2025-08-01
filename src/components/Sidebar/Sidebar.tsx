"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/components/Sidebar.module.css";
import { formatDateForDisplay } from "@/lib/utils";
import { TodoCounts } from "@/lib/types";
import ContextMenu from "../ContextMenu";
import { useDateContextMenu } from "@/hooks/useContextMenu";
import { useClientOnly } from "@/hooks/useClientOnly";

interface SidebarProps {
  currentDate: string;
  onDateSelect: (date: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  todoCounts: TodoCounts;
}

export default function Sidebar({
  currentDate,
  onDateSelect,
  isCollapsed,
  onToggleCollapse,
  todoCounts,
}: SidebarProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateAliases, setDateAliases] = useState<Record<string, string>>({});
  const isClient = useClientOnly();

  // Use the date context menu hook
  const {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    getDateContextMenuOptions,
  } = useDateContextMenu(() => {
    // Refresh callback - refetch data instead of reloading page
    const fetchDateAliases = async () => {
      try {
        const response = await fetch("/api/date-aliases");
        if (response.ok) {
          const aliases = await response.json();
          setDateAliases(aliases);
        }
      } catch (error) {
        console.error("Failed to fetch date aliases:", error);
      }
    };

    fetchDateAliases();
    // Trigger a re-render by updating a timestamp or similar
    window.dispatchEvent(new Event("todoCountsChanged"));
  });

  // Fetch date aliases
  useEffect(() => {
    if (!isClient) return;

    const fetchDateAliases = async () => {
      try {
        const response = await fetch("/api/date-aliases");
        if (response.ok) {
          const aliases = await response.json();
          setDateAliases(aliases);
        }
      } catch (error) {
        console.error("Failed to fetch date aliases:", error);
      }
    };

    fetchDateAliases();
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    // Get all dates that have todos, plus today
    const today = new Date().toISOString().split("T")[0];
    const datesWithTodos = Object.keys(todoCounts);

    // Add today if it's not already in the list
    if (!datesWithTodos.includes(today)) {
      datesWithTodos.push(today);
    }

    // Get pinned dates from localStorage
    const pinnedDates = JSON.parse(localStorage.getItem("pinnedDates") || "[]");

    // Separate pinned and unpinned dates
    const pinnedDatesList = datesWithTodos.filter((date) =>
      pinnedDates.includes(date)
    );
    const unpinnedDatesList = datesWithTodos.filter(
      (date) => !pinnedDates.includes(date)
    );

    // Sort both lists - for copy-* identifiers, sort by creation time (timestamp)
    // For regular dates, sort by date
    const sortDates = (dates: string[]) => {
      return dates.sort((a, b) => {
        // If both are copy identifiers, sort by timestamp (newest first)
        if (a.startsWith("copy-") && b.startsWith("copy-")) {
          const timestampA = parseInt(a.split("-")[2] || "0");
          const timestampB = parseInt(b.split("-")[2] || "0");
          return timestampB - timestampA;
        }
        // If both are regular dates, sort by date (newest first)
        if (!a.startsWith("copy-") && !b.startsWith("copy-")) {
          return new Date(b).getTime() - new Date(a).getTime();
        }
        // Mixed: regular dates first, then copy identifiers
        if (!a.startsWith("copy-") && b.startsWith("copy-")) {
          return -1;
        }
        if (a.startsWith("copy-") && !b.startsWith("copy-")) {
          return 1;
        }
        return 0;
      });
    };

    const sortedPinnedDates = sortDates(pinnedDatesList);
    const sortedUnpinnedDates = sortDates(unpinnedDatesList);

    // Combine with pinned dates first
    const sortedDates = [...sortedPinnedDates, ...sortedUnpinnedDates];
    setAvailableDates(sortedDates);
  }, [todoCounts, isClient]);

  const handleContextMenu = (e: React.MouseEvent, date: string) => {
    showContextMenu(e, date);
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        <h3>Todo 文件</h3>
        <button className={styles.collapseBtn} onClick={onToggleCollapse}>
          <span>{isCollapsed ? "▶" : "◀"}</span>
        </button>
      </div>

      <ul className={styles.dateList}>
        {availableDates.map((date) => {
          // Check if date is pinned (only on client side)
          let isPinned = false;
          if (isClient) {
            const pinnedDates = JSON.parse(
              localStorage.getItem("pinnedDates") || "[]"
            );
            isPinned = pinnedDates.includes(date);
          }

          return (
            <li
              key={date}
              className={`${styles.dateItem} ${
                date === currentDate ? styles.active : ""
              } ${isPinned ? styles.pinned : ""}`}
              onClick={() => onDateSelect(date)}
              onContextMenu={(e) => handleContextMenu(e, date)}
              data-date={date}
            >
              <span className={styles.dateName}>
                {dateAliases[date] || formatDateForDisplay(date)}
              </span>
              {isPinned && <span className={styles.pinIcon}>📌</span>}
            </li>
          );
        })}
      </ul>

      <ContextMenu
        isVisible={contextMenu.isVisible}
        position={contextMenu.position}
        options={
          contextMenu.data
            ? getDateContextMenuOptions(contextMenu.data, todoCounts)
            : []
        }
        onClose={hideContextMenu}
      />
    </div>
  );
}
