"use client";

import TodoList from "@/components/TodoList";
import Search from "@/components/Search";
import { useTodoContext } from "@/contexts/TodoContext";
import { Todo } from "@/components/TodoList";

export default function TodoContainer() {
  const { currentDate, isSearchMode, setIsSearchMode, setCurrentDate } =
    useTodoContext();

  const handleTodoSelect = (todo: Todo) => {
    // Switch to the date of the selected todo
    setCurrentDate(todo.date);
    setIsSearchMode(false);
  };

  if (isSearchMode) {
    return <Search onTodoSelect={handleTodoSelect} />;
  }

  return <TodoList selectedDate={currentDate} />;
}
