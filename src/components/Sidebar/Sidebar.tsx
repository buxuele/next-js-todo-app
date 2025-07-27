"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/components/Sidebar.module.css";
import { formatDateForDisplay } from "@/lib/utils";
import { TodoCounts } from "@/lib/types";
import ContextMenu from "../ContextMenu";
import { useDateContextMenu } from "@/hooks/useContextMenu";

interface SidebarProps {
  currentDate: string;
  onDateSelect: (date: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  todoCounts: TodoCounts;
  isSearchMode: boolean;
  onToggleSearch: () => void;
}

export default function Sidebar({
  currentDate,
  onDateSelect,
  isCollapsed,
  onToggleCollapse,
  todoCounts,
  isSearchMode,
  onToggleSearch,
}: SidebarProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Use the date context menu hook
  const {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    getDateContextMenuOptions,
  } = useDateContextMenu(() => {
    // Refresh callback - reload the page for now
    window.location.reload();
  });

  useEffect(() => {
    // Get all dates that have todos, plus today
    const today = new Date().toISOString().split("T")[0];
    const datesWithTodos = Object.keys(todoCounts);

    // Add today if it's not already in the list
    if (!datesWithTodos.includes(today)) {
      datesWithTodos.push(today);
    }

    // Sort dates in descending order (newest first)
    const sortedDates = datesWithTodos.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    setAvailableDates(sortedDates);
  }, [todoCounts]);

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

      <div className={styles.searchSection}>
        <button
          className={`${styles.searchBtn} ${isSearchMode ? styles.active : ""}`}
          onClick={onToggleSearch}
          title="Search todos"
        >
          <span className={styles.searchIcon}>🔍</span>
          {!isCollapsed && <span>Search Todos</span>}
        </button>
      </div>

      <ul className={styles.dateList}>
        {availableDates.map((date) => (
          <li
            key={date}
            className={`${styles.dateItem} ${
              date === currentDate ? styles.active : ""
            }`}
            onClick={() => onDateSelect(date)}
            onContextMenu={(e) => handleContextMenu(e, date)}
            data-date={date}
          >
            <span className={styles.dateName}>
              {formatDateForDisplay(date)}
            </span>
          </li>
        ))}
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
