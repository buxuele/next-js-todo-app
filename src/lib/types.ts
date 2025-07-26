export interface Todo {
  id: number;
  content: string;
  completed: boolean;
  orderNum: number;
  date: string;
  createdAt: string;
  completedAt?: string;
}

export interface DateAlias {
  id: number;
  date: string;
  alias: string;
  createdAt: string;
}

export interface TodoCounts {
  [date: string]: number;
}

export interface SearchResult extends Todo {
  highlightedContent: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AppState {
  currentDate: string;
  sidebarCollapsed: boolean;
  searchMode: boolean;
  searchTerm: string;
  todos: Todo[];
  dateAliases: Record<string, string>;
  todoCounts: TodoCounts;
}
