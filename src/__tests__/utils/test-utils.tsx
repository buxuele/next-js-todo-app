import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { TodoProvider } from "@/contexts/TodoContext";

// Mock data for testing
export const mockTodos = [
  {
    id: 1,
    content: "Test todo 1",
    completed: false,
    orderNum: 1,
    date: "2025-07-26",
    createdAt: "2025-07-26T10:00:00.000Z",
    completedAt: null,
  },
  {
    id: 2,
    content: "Test todo 2",
    completed: true,
    orderNum: 2,
    date: "2025-07-26",
    createdAt: "2025-07-26T10:01:00.000Z",
    completedAt: "2025-07-26T10:30:00.000Z",
  },
  {
    id: 3,
    content: "Test todo 3",
    completed: false,
    orderNum: 3,
    date: "2025-07-25",
    createdAt: "2025-07-25T09:00:00.000Z",
    completedAt: null,
  },
];

export const mockTodoCounts = [
  {
    date: "2025-07-26",
    total: 2,
    completed: 1,
    pending: 1,
  },
  {
    date: "2025-07-25",
    total: 1,
    completed: 0,
    pending: 1,
  },
];

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <TodoProvider>{children}</TodoProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Mock API responses
export const mockApiResponse = (data: unknown, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
};

// Mock fetch implementation
export const mockFetch = (responses: Record<string, unknown>) => {
  const fetchMock = jest.fn((url: string, options?: RequestInit) => {
    const method = options?.method || "GET";
    const key = `${method} ${url}`;

    if (responses[key]) {
      return mockApiResponse(responses[key]);
    }

    // Default responses
    if (url.includes("/api/todos/counts")) {
      return mockApiResponse(mockTodoCounts);
    }

    if (url.includes("/api/todos?date=")) {
      const date = new URL(url, "http://localhost").searchParams.get("date");
      const todosForDate = mockTodos.filter((todo) => todo.date === date);
      return mockApiResponse(todosForDate);
    }

    if (url.includes("/api/todos/search")) {
      const query = new URL(url, "http://localhost").searchParams.get("q");
      const filteredTodos = mockTodos.filter((todo) =>
        todo.content.toLowerCase().includes(query?.toLowerCase() || "")
      );
      return mockApiResponse({
        query,
        results: filteredTodos,
        count: filteredTodos.length,
      });
    }

    return mockApiResponse({ error: "Not found" }, 404);
  });

  global.fetch = fetchMock;
  return fetchMock;
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: "" },
  ...overrides,
});

export const createMockMouseEvent = (overrides = {}) => ({
  ...createMockEvent(),
  clientX: 100,
  clientY: 100,
  button: 0,
  ...overrides,
});

export const createMockKeyboardEvent = (key: string, overrides = {}) => ({
  ...createMockEvent(),
  key,
  code: key,
  keyCode: key.charCodeAt(0),
  which: key.charCodeAt(0),
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...overrides,
});
