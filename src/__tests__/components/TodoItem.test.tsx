import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockTodos } from "../utils/test-utils";
import TodoItem from "@/components/TodoItem";

describe("TodoItem Component", () => {
  const mockTodo = mockTodos[0]; // Incomplete todo
  const completedTodo = mockTodos[1]; // Completed todo
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    todo: mockTodo,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders todo content correctly", () => {
    render(<TodoItem {...defaultProps} />);

    expect(screen.getByText("Test todo 1")).toBeInTheDocument();
  });

  it("shows completed styling for completed todos", () => {
    render(<TodoItem {...defaultProps} todo={completedTodo} />);

    const todoItem = screen.getByText("Test todo 2").closest("div");
    expect(todoItem).toHaveClass("completed");
  });

  it("toggles completion on double-click", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.dblClick(todoText);

    expect(mockOnUpdate).toHaveBeenCalledWith(1, { completed: true });
  });

  it("enters edit mode on single click", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText);

    expect(screen.getByDisplayValue("Test todo 1")).toBeInTheDocument();
  });

  it("saves changes on Enter key", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText);

    const textarea = screen.getByDisplayValue("Test todo 1");
    await user.clear(textarea);
    await user.type(textarea, "Updated todo content");
    await user.keyboard("{Enter}");

    expect(mockOnUpdate).toHaveBeenCalledWith(1, {
      content: "Updated todo content",
    });
  });

  it("cancels editing on Escape key", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText);

    const textarea = screen.getByDisplayValue("Test todo 1");
    await user.clear(textarea);
    await user.type(textarea, "Changed content");
    await user.keyboard("{Escape}");

    expect(screen.getByText("Test todo 1")).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("allows line breaks with Shift+Enter in edit mode", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText);

    const textarea = screen.getByDisplayValue("Test todo 1");
    await user.clear(textarea);
    await user.type(textarea, "Line 1");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(textarea, "Line 2");

    expect(textarea).toHaveValue("Line 1\nLine 2");
  });

  it("saves changes on blur", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText);

    const textarea = screen.getByDisplayValue("Test todo 1");
    await user.clear(textarea);
    await user.type(textarea, "Updated content");

    // Simulate blur by clicking outside
    await user.click(document.body);

    expect(mockOnUpdate).toHaveBeenCalledWith(1, {
      content: "Updated content",
    });
  });

  it("copies content to clipboard", async () => {
    const user = userEvent.setup();
    const mockWriteText = jest.fn(() => Promise.resolve());
    navigator.clipboard.writeText = mockWriteText;

    render(<TodoItem {...defaultProps} />);

    const todoItem = screen.getByText("Test todo 1").closest("div");
    await user.hover(todoItem!);

    const copyButton = screen.getByTitle("Copy to clipboard");
    await user.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith("Test todo 1");
  });

  it("shows copy feedback after successful copy", async () => {
    const user = userEvent.setup();
    navigator.clipboard.writeText = jest.fn(() => Promise.resolve());

    render(<TodoItem {...defaultProps} />);

    const todoItem = screen.getByText("Test todo 1").closest("div");
    await user.hover(todoItem!);

    const copyButton = screen.getByTitle("Copy to clipboard");
    await user.click(copyButton);

    expect(screen.getByText("Copied!")).toBeInTheDocument();

    // Feedback should disappear after timeout
    await waitFor(
      () => {
        expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("deletes todo with confirmation", async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn(() => true);

    render(<TodoItem {...defaultProps} />);

    const todoItem = screen.getByText("Test todo 1").closest("div");
    await user.hover(todoItem!);

    const deleteButton = screen.getByTitle("Delete todo");
    await user.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this todo?"
    );
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it("does not delete todo when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn(() => false);

    render(<TodoItem {...defaultProps} />);

    const todoItem = screen.getByText("Test todo 1").closest("div");
    await user.hover(todoItem!);

    const deleteButton = screen.getByTitle("Delete todo");
    await user.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("shows creation time", () => {
    render(<TodoItem {...defaultProps} />);

    // The exact time format may vary, so just check that some time is displayed
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it("shows completion time for completed todos", () => {
    render(<TodoItem {...defaultProps} todo={completedTodo} />);

    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });

  it("prevents double-click toggle when in edit mode", async () => {
    const user = userEvent.setup();
    render(<TodoItem {...defaultProps} />);

    const todoText = screen.getByText("Test todo 1");
    await user.click(todoText); // Enter edit mode

    const textarea = screen.getByDisplayValue("Test todo 1");
    await user.dblClick(textarea);

    // Should not call onUpdate for completion toggle
    expect(mockOnUpdate).not.toHaveBeenCalledWith(1, { completed: true });
  });
});
