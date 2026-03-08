import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import TestEmailSection from "./TestEmailSection";

// Mock Supabase client
const mockInvoke = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
    },
    functions: {
      invoke: (name: string, options: any) => mockInvoke(name, options),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [
              { recipients: ["recent1@example.com", "recent2@example.com"] },
            ],
          }),
        })),
      })),
    })),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("TestEmailSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { email: "admin@test.com" } },
    });
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
    });
  });

  it("renders the test email section with label and button", () => {
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    expect(screen.getByText("Send Test Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email address...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send test/i })).toBeInTheDocument();
  });

  it("shows 'Send to myself' button when user email is loaded", async () => {
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send to myself/i })).toBeInTheDocument();
    });
  });

  it("fills input with user email when clicking 'Send to myself'", async () => {
    const user = userEvent.setup();
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /send to myself/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /send to myself/i }));

    const input = screen.getByPlaceholderText("Enter email address...") as HTMLInputElement;
    expect(input.value).toBe("admin@test.com");
  });

  it("disables send button when subject or body is empty", () => {
    render(<TestEmailSection subject="" body="Test Body" />);

    const sendButton = screen.getByRole("button", { name: /send test/i });
    expect(sendButton).toBeDisabled();
  });

  it("allows typing email address", async () => {
    const user = userEvent.setup();
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    const input = screen.getByPlaceholderText("Enter email address...");
    await user.type(input, "test@example.com");

    expect(input).toHaveValue("test@example.com");
  });

  it("shows autocomplete suggestions on focus", async () => {
    const user = userEvent.setup();
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    const input = screen.getByPlaceholderText("Enter email address...");
    await user.click(input);

    await waitFor(() => {
      // Either shows loading or recent emails
      const loadingOrEmails = screen.queryByText(/loading recent emails/i) || 
                              screen.queryByText("recent1@example.com");
      expect(loadingOrEmails).toBeInTheDocument();
    });
  });

  it("calls edge function with correct parameters on send", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
    const user = userEvent.setup();

    render(<TestEmailSection subject="Test Subject" body="<p>Test Body</p>" />);

    const input = screen.getByPlaceholderText("Enter email address...");
    await user.type(input, "recipient@example.com");

    const sendButton = screen.getByRole("button", { name: /send test/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-test-campaign-email", {
        body: {
          email: "recipient@example.com",
          subject: "Test Subject",
          body: "<p>Test Body</p>",
        },
      });
    });
  });

  it("clears input after successful send", async () => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
    const user = userEvent.setup();

    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    const input = screen.getByPlaceholderText("Enter email address...");
    await user.type(input, "recipient@example.com");

    const sendButton = screen.getByRole("button", { name: /send test/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("shows loading state while sending", async () => {
    mockInvoke.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const user = userEvent.setup();

    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    const input = screen.getByPlaceholderText("Enter email address...");
    await user.type(input, "recipient@example.com");

    const sendButton = screen.getByRole("button", { name: /send test/i });
    await user.click(sendButton);

    // Button should show loading spinner
    expect(sendButton).toBeDisabled();
  });

  it("displays helper text", () => {
    render(<TestEmailSection subject="Test Subject" body="Test Body" />);

    expect(
      screen.getByText(/preview this email in an actual inbox/i)
    ).toBeInTheDocument();
  });
});
