import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockFetch, mockTodos } from "../utils/test-utils";
import TodoList from "@/components/TodoList";

// Mock the hooks
jest.mock("@/hooks/useTodos", () => ({
  useTodos: jest.fn(),
}));

jest.mock("@/contexts/TodoContext", () => ({
  useTodoContext: () => ({
    refreshTodoCounts: jest.fn(),
  }),
}));

const mockUseTodos = jest.mocked(jest.requireMock("@/hooks/useTodos").useTodos);

describe("TodoList Component", () => {
  const defaultProps = {
    selectedDate: "2025-07-26",
    onTodoUpdate: jest.fn(),
  };

  beforeEach(() => {
    mockFetch({});
    mockUseTodos.mockReturnValue({
      todos: mockTodos.filter((todo) => todo.date === "2025-07-26"),
      loading: false,
      error: null,
      addTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseTodos.mockReturnValue({
      todos: [],
      loading: true,
      error: null,
      addTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    expect(screen.getByText("Loading todos...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    const mockClearError = jest.fn();
    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: "Failed to fetch todos",
      addTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: mockClearError,
    });

    render(<TodoList {...defaultProps} />);

    expect(screen.getByText(/Failed to fetch todos/)).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(mockClearError).toHaveBeenCalled();
  });

  it("renders todos correctly", () => {
    render(<TodoList {...defaultProps} />);

    expect(screen.getByText("Test todo 1")).toBeInTheDocument();
    expect(screen.getByText("Test todo 2")).toBeInTheDocument();
    expect(screen.queryByText("Test todo 3")).not.toBeInTheDocument(); // Different date
  });

  it("allows adding a new todo", async () => {
    const user = userEvent.setup();
    const mockAddTodo = jest.fn().mockResolvedValue(undefined);

    mockUseTodos.mockReturnValue({
      todos: mockTodos.filter((todo) => todo.date === "2025-07-26"),
      loading: false,
      error: null,
      addTodo: mockAddTodo,
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    const input = screen.getByPlaceholderText("Add a new todo...");
    const addButton = screen.getByRole("button", { name: /add/i });

    await user.type(input, "New test todo");
    await user.click(addButton);

    expect(mockAddTodo).toHaveBeenCalledWith("New test todo", "2025-07-26");
  });

  it("prevents adding empty todos", async () => {
    const user = userEvent.setup();
    const mockAddTodo = jest.fn();

    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: null,
      addTodo: mockAddTodo,
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add/i });

    await user.click(addButton);

    expect(mockAddTodo).not.toHaveBeenCalled();
  });

  it("handles keyboard shortcuts for new todo input", async () => {
    const user = userEvent.setup();
    const mockAddTodo = jest.fn().mockResolvedValue(undefined);

    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: null,
      addTodo: mockAddTodo,
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    const input = screen.getByPlaceholderText("Add a new todo...");

    await user.type(input, "Test todo");
    await user.keyboard("{Enter}");

    expect(mockAddTodo).toHaveBeenCalledWith("Test todo", "2025-07-26");
  });

  it("allows line breaks with Shift+Enter", async () => {
    const user = userEvent.setup();

    render(<TodoList {...defaultProps} />);

    const input = screen.getByPlaceholderText("Add a new todo...");

    await user.type(input, "Line 1");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(input, "Line 2");

    expect(input).toHaveValue("Line 1\nLine 2");
  });

  it("clears input on Escape key", async () => {
    const user = userEvent.setup();

    render(<TodoList {...defaultProps} />);

    const input = screen.getByPlaceholderText("Add a new todo...");

    await user.type(input, "Test content");
    expect(input).toHaveValue("Test content");

    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
  });

  it("shows export button when todos exist", () => {
    render(<TodoList {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /export as markdown/i })
    ).toBeInTheDocument();
  });

  it("disables export button when no todos exist", () => {
    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: null,
      addTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /export as markdown/i,
    });
    expect(exportButton).toBeDisabled();
  });

  it("shows empty state when no todos exist", () => {
    mockUseTodos.mockReturnValue({
      todos: [],
      loading: false,
      error: null,
      addTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      clearError: jest.fn(),
    });

    render(<TodoList {...defaultProps} />);

    expect(
      screen.getByText("No todos for this date. Add one above!")
    ).toBeInTheDocument();
  });
});
