import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import EmailAutocompleteInput from "./email-autocomplete-input";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "user@test.com" } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [
              { recipients: ["alice@example.com", "bob@example.com"] },
              { recipients: ["charlie@example.com"] },
            ],
          }),
        })),
      })),
    })),
  },
}));

describe("EmailAutocompleteInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders input with placeholder", () => {
      render(<EmailAutocompleteInput placeholder="Enter email..." />);
      expect(screen.getByPlaceholderText("Enter email...")).toBeInTheDocument();
    });

    it("renders with controlled value", () => {
      render(
        <EmailAutocompleteInput
          value="test@example.com"
          onValueChange={() => {}}
        />
      );
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });

    it("shows 'Send to myself' button when enabled", async () => {
      render(<EmailAutocompleteInput showSendToMyself />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /send to myself/i })).toBeInTheDocument();
      });
    });

    it("hides 'Send to myself' button when disabled", () => {
      render(<EmailAutocompleteInput showSendToMyself={false} />);
      expect(screen.queryByRole("button", { name: /send to myself/i })).not.toBeInTheDocument();
    });
  });

  describe("clear button", () => {
    it("shows clear button when there is a value", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.type(input, "test@example.com");

      expect(screen.getByLabelText("Clear email")).toBeInTheDocument();
    });

    it("hides clear button when value is empty", () => {
      render(<EmailAutocompleteInput placeholder="Enter email..." />);
      expect(screen.queryByLabelText("Clear email")).not.toBeInTheDocument();
    });

    it("clears input when clear button is clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <EmailAutocompleteInput
          value="test@example.com"
          onValueChange={onValueChange}
        />
      );

      await user.click(screen.getByLabelText("Clear email"));
      expect(onValueChange).toHaveBeenCalledWith("");
    });

    it("respects hideClearButton prop", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." hideClearButton />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.type(input, "test@example.com");

      expect(screen.queryByLabelText("Clear email")).not.toBeInTheDocument();
    });
  });

  describe("autocomplete suggestions", () => {
    it("shows suggestions dropdown on focus", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);

      await waitFor(() => {
        // Should show loading or suggestions
        const dropdown = screen.queryByText(/loading recent emails/i) ||
                        screen.queryByText("alice@example.com");
        expect(dropdown).toBeInTheDocument();
      });
    });

    it("filters suggestions based on input", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);
      await user.type(input, "alice");

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      });

      expect(screen.queryByText("bob@example.com")).not.toBeInTheDocument();
    });

    it("selects suggestion on click", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <EmailAutocompleteInput
          placeholder="Enter email..."
          value=""
          onValueChange={onValueChange}
        />
      );

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      });

      // Use mouseDown to simulate clicking the suggestion
      fireEvent.mouseDown(screen.getByText("alice@example.com"));

      expect(onValueChange).toHaveBeenCalledWith("alice@example.com");
    });
  });

  describe("keyboard navigation", () => {
    it("navigates suggestions with arrow keys", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      });

      // Press ArrowDown to highlight first item
      await user.keyboard("{ArrowDown}");

      // The first item should be highlighted (has bg-accent class)
      const firstSuggestion = screen.getByText("alice@example.com");
      expect(firstSuggestion.closest("button")).toHaveClass("bg-accent");
    });

    it("closes suggestions on Escape", async () => {
      const user = userEvent.setup();
      render(<EmailAutocompleteInput placeholder="Enter email..." />);

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
      });
    });
  });

  describe("disabled state", () => {
    it("disables input when disabled prop is true", () => {
      render(<EmailAutocompleteInput placeholder="Enter email..." disabled />);
      expect(screen.getByPlaceholderText("Enter email...")).toBeDisabled();
    });

    it("disables input when isSubmitting is true", () => {
      render(<EmailAutocompleteInput placeholder="Enter email..." isSubmitting />);
      expect(screen.getByPlaceholderText("Enter email...")).toBeDisabled();
    });

    it("hides clear button when disabled", async () => {
      render(
        <EmailAutocompleteInput
          value="test@example.com"
          onValueChange={() => {}}
          disabled
        />
      );

      expect(screen.queryByLabelText("Clear email")).not.toBeInTheDocument();
    });
  });

  describe("send to myself", () => {
    it("fills input with user email when clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <EmailAutocompleteInput
          showSendToMyself
          value=""
          onValueChange={onValueChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /send to myself/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /send to myself/i }));

      expect(onValueChange).toHaveBeenCalledWith("user@test.com");
    });

    it("uses custom label for send to myself button", async () => {
      render(
        <EmailAutocompleteInput
          showSendToMyself
          sendToMyselfLabel="Use my email"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /use my email/i })).toBeInTheDocument();
      });
    });
  });

  describe("callbacks", () => {
    it("calls onEmailSelect when email is selected from suggestions", async () => {
      const user = userEvent.setup();
      const onEmailSelect = vi.fn();

      render(
        <EmailAutocompleteInput
          placeholder="Enter email..."
          onEmailSelect={onEmailSelect}
        />
      );

      const input = screen.getByPlaceholderText("Enter email...");
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      });

      fireEvent.mouseDown(screen.getByText("alice@example.com"));

      expect(onEmailSelect).toHaveBeenCalledWith("alice@example.com");
    });
  });
});
