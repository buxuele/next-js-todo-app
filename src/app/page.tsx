"use client";

import { TodoProvider } from "@/contexts/TodoContext";
import Sidebar from "@/components/Sidebar/Sidebar";
import TodoList from "@/components/TodoList";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import styles from "./page.module.css";

export default function Home() {
  const {
    currentDate,
    setCurrentDate,
    sidebarCollapsed,
    setSidebarCollapsed,
    todoCounts,
  } = useDateNavigation();

  const handleDateSelect = (date: string) => {
    setCurrentDate(date);
  };

  return (
    <TodoProvider>
      <div className={styles.app}>
        <Sidebar
          currentDate={currentDate}
          onDateSelect={handleDateSelect}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          todoCounts={todoCounts}
        />

        <main className={styles.main}>
          <div className={styles.container}>
            <TodoList selectedDate={currentDate} />
          </div>
        </main>
      </div>
    </TodoProvider>
  );
}
