"use client";

import Sidebar from "../Sidebar/Sidebar";
import KeyboardShortcuts from "../KeyboardShortcuts";
import ErrorBoundary from "../ErrorBoundary";
import styles from "@/styles/components/Layout.module.css";
import { useTodoContext } from "@/contexts/TodoContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const {
    currentDate,
    setCurrentDate,
    sidebarCollapsed,
    setSidebarCollapsed,
    todoCounts,
    isSearchMode,
    setIsSearchMode,
  } = useTodoContext();

  const handleDateSelect = (date: string) => {
    setCurrentDate(date);
    setIsSearchMode(false); // Exit search mode when selecting a date
  };

  const handleToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleToggleSearch = () => {
    setIsSearchMode(!isSearchMode);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        currentDate={currentDate}
        onDateSelect={handleDateSelect}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        todoCounts={todoCounts}
        isSearchMode={isSearchMode}
        onToggleSearch={handleToggleSearch}
      />

      <div className={styles.mainContent}>
        <ErrorBoundary>
          <div className={styles.container}>{children}</div>
        </ErrorBoundary>
      </div>

      <KeyboardShortcuts />
    </div>
  );
}
