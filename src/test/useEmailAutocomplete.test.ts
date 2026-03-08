import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEmailAutocomplete } from "@/hooks/useEmailAutocomplete";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "admin@test.com" } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({
            data: [
              { recipients: ["user1@example.com", "user2@example.com"] },
              { recipients: ["user3@example.com", "user1@example.com"] },
            ],
          }),
        })),
      })),
    })),
  },
}));

describe("useEmailAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      expect(result.current.value).toBe("");
      expect(result.current.showSuggestions).toBe(false);
      expect(result.current.highlightedIndex).toBe(-1);
      expect(result.current.isLoading).toBe(true);
    });

    it("should accept initial value", () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({ initialValue: "test@example.com" })
      );

      expect(result.current.value).toBe("test@example.com");
    });

    it("should fetch user email on mount", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      // Wait for async operations
      await vi.waitFor(() => {
        expect(result.current.userEmail).toBe("admin@test.com");
      });
    });

    it("should fetch recent emails from notification history", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have unique emails from the mocked data
      expect(result.current.recentEmails).toContain("user1@example.com");
      expect(result.current.recentEmails).toContain("user2@example.com");
      expect(result.current.recentEmails).toContain("user3@example.com");
    });
  });

  describe("filtering", () => {
    it("should filter emails based on input value", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("user1");
      });

      expect(result.current.filteredEmails).toContain("user1@example.com");
      expect(result.current.filteredEmails).not.toContain("user2@example.com");
    });

    it("should be case-insensitive when filtering", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("USER1");
      });

      expect(result.current.filteredEmails).toContain("user1@example.com");
    });

    it("should respect maxSuggestions option", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({ maxSuggestions: 2 })
      );

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.filteredEmails.length).toBeLessThanOrEqual(2);
    });

    it("should show all emails when value is empty", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.filteredEmails.length).toBeGreaterThan(0);
    });
  });

  describe("keyboard navigation", () => {
    it("should open suggestions on ArrowDown when closed", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const event = {
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.showSuggestions).toBe(true);
      expect(result.current.highlightedIndex).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should navigate down through suggestions", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Open suggestions first
      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(0);
      });

      const event = {
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.highlightedIndex).toBe(1);
    });

    it("should wrap around when navigating past last item", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({ maxSuggestions: 3 })
      );

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(2); // Last item (0-indexed)
      });

      const event = {
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.highlightedIndex).toBe(0); // Wrapped to first
    });

    it("should navigate up through suggestions", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(2);
      });

      const event = {
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.highlightedIndex).toBe(1);
    });

    it("should wrap around when navigating before first item", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({ maxSuggestions: 3 })
      );

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(0);
      });

      const event = {
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.highlightedIndex).toBe(2); // Wrapped to last
    });

    it("should select highlighted email on Enter", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(0);
      });

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.value).toBe(result.current.filteredEmails[0]);
      expect(result.current.showSuggestions).toBe(false);
      expect(result.current.highlightedIndex).toBe(-1);
    });

    it("should close suggestions on Escape", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setShowSuggestions(true);
        result.current.setHighlightedIndex(1);
      });

      const event = {
        key: "Escape",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLInputElement>;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.showSuggestions).toBe(false);
      expect(result.current.highlightedIndex).toBe(-1);
    });
  });

  describe("helper functions", () => {
    it("should clear value with clearValue", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({ initialValue: "test@example.com" })
      );

      act(() => {
        result.current.clearValue();
      });

      expect(result.current.value).toBe("");
      expect(result.current.highlightedIndex).toBe(-1);
    });

    it("should fill with user email using fillWithUserEmail", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.userEmail).toBe("admin@test.com");
      });

      act(() => {
        result.current.fillWithUserEmail();
      });

      expect(result.current.value).toBe("admin@test.com");
    });
  });

  describe("localStorage integration", () => {
    it("should load emails from localStorage when enabled", () => {
      localStorage.setItem(
        "test_emails",
        JSON.stringify(["local1@example.com", "local2@example.com"])
      );

      const { result } = renderHook(() =>
        useEmailAutocomplete({
          includeLocalStorage: true,
          localStorageKey: "test_emails",
        })
      );

      // Local emails should be merged with DB emails
      expect(result.current.recentEmails).toContain("local1@example.com");
      expect(result.current.recentEmails).toContain("local2@example.com");
    });

    it("should save emails to localStorage with saveToLocalStorage", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({
          includeLocalStorage: true,
          localStorageKey: "save_test_emails",
        })
      );

      act(() => {
        result.current.saveToLocalStorage([
          "saved1@example.com",
          "saved2@example.com",
        ]);
      });

      const stored = JSON.parse(
        localStorage.getItem("save_test_emails") || "[]"
      );
      expect(stored).toContain("saved1@example.com");
      expect(stored).toContain("saved2@example.com");
    });

    it("should validate emails before saving to localStorage", async () => {
      const { result } = renderHook(() =>
        useEmailAutocomplete({
          includeLocalStorage: true,
          localStorageKey: "validate_test_emails",
        })
      );

      act(() => {
        result.current.saveToLocalStorage([
          "valid@example.com",
          "invalid-email",
          "another@valid.com",
        ]);
      });

      const stored = JSON.parse(
        localStorage.getItem("validate_test_emails") || "[]"
      );
      expect(stored).toContain("valid@example.com");
      expect(stored).toContain("another@valid.com");
      expect(stored).not.toContain("invalid-email");
    });
  });

  describe("multi-email support", () => {
    it("should filter suggestions for multi-email input", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("first@example.com, user");
      });

      const suggestions = result.current.getMultiEmailSuggestions([
        "first@example.com",
      ]);

      // Should not include already-added email
      expect(suggestions).not.toContain("first@example.com");
      // Should include emails matching "user"
      expect(suggestions.some((e) => e.includes("user"))).toBe(true);
    });

    it("should exclude existing emails from suggestions", async () => {
      const { result } = renderHook(() => useEmailAutocomplete());

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("user");
      });

      const suggestions = result.current.getMultiEmailSuggestions([
        "user1@example.com",
      ]);

      expect(suggestions).not.toContain("user1@example.com");
    });
  });
});
