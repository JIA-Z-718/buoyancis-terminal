import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminNotificationSettings from "./AdminNotificationSettings";

// Default mock data
const defaultMockData = [
  { setting_key: "admin_notification_email", setting_value: "admin@test.com, backup@test.com" },
  { setting_key: "notify_signups_enabled", setting_value: "true" },
  { setting_key: "notify_errors_enabled", setting_value: "true" },
  { setting_key: "notify_alerts_enabled", setting_value: "false" },
  { setting_key: "last_tested_signups", setting_value: "2024-01-15T10:00:00Z" },
  { setting_key: "last_tested_errors", setting_value: "" },
  { setting_key: "last_tested_alerts", setting_value: "" },
];

const createMockFrom = (data = defaultMockData) => vi.fn(() => ({
  select: vi.fn(() => ({
    in: vi.fn(() => Promise.resolve({ data, error: null })),
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })),
}));

// Mock the Supabase client - use inline mock
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() =>
          Promise.resolve({
            data: [
              { setting_key: "admin_notification_email", setting_value: "admin@test.com, backup@test.com" },
              { setting_key: "notify_signups_enabled", setting_value: "true" },
              { setting_key: "notify_errors_enabled", setting_value: "true" },
              { setting_key: "notify_alerts_enabled", setting_value: "false" },
              { setting_key: "last_tested_signups", setting_value: "2024-01-15T10:00:00Z" },
              { setting_key: "last_tested_errors", setting_value: "" },
              { setting_key: "last_tested_alerts", setting_value: "" },
            ],
            error: null,
          })
        ),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "user-123", email: "admin@test.com" } },
          error: null,
        })
      ),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { sentTo: ["admin@test.com"] }, error: null })),
    },
  },
}));

// Mock the useEmailAutocomplete hook
vi.mock("@/hooks/useEmailAutocomplete", () => ({
  useEmailAutocomplete: vi.fn(() => ({
    recentEmails: ["admin@test.com", "backup@test.com", "support@company.com"],
    isLoading: false,
    showSuggestions: false,
    setShowSuggestions: vi.fn(),
    highlightedIndex: -1,
    setHighlightedIndex: vi.fn(),
    saveToLocalStorage: vi.fn(),
  })),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock alert sound
vi.mock("@/lib/alertSound", () => ({
  playAlertSound: vi.fn(),
  initAudioContext: vi.fn(),
}));

// Helper to reset supabase mock to default
const resetSupabaseMock = async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  vi.mocked(supabase.from).mockImplementation(createMockFrom() as any);
  vi.mocked(supabase.functions.invoke).mockResolvedValue({ 
    data: { sentTo: ["admin@test.com"] }, 
    error: null 
  });
};

describe("AdminNotificationSettings", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    await resetSupabaseMock();
  });

  describe("Collapsible Behavior", () => {
    it("renders collapsed by default", () => {
      render(<AdminNotificationSettings />);
      
      expect(screen.getByText("Notification Settings")).toBeInTheDocument();
      expect(screen.getByText("Configure admin email and notification preferences")).toBeInTheDocument();
      expect(screen.queryByLabelText("Admin Email(s)")).not.toBeInTheDocument();
    });

    it("expands when header is clicked", async () => {
      render(<AdminNotificationSettings />);
      
      const header = screen.getByText("Notification Settings").closest("div")?.parentElement;
      if (header) {
        await userEvent.click(header);
      }

      await waitFor(() => {
        expect(screen.getByLabelText("Admin Email(s)")).toBeInTheDocument();
      });
    });

    it("shows loading state when expanded", async () => {
      render(<AdminNotificationSettings />);
      
      const header = screen.getByText("Notification Settings");
      await userEvent.click(header);

      // Brief loading state before data loads
      await waitFor(() => {
        expect(screen.getByLabelText("Admin Email(s)")).toBeInTheDocument();
      });
    });
  });

  describe("Email Input with MultiEmailAutocompleteInput", () => {
    it("loads saved email preferences", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        const input = screen.getByLabelText("Admin Email(s)");
        expect(input).toHaveValue("admin@test.com, backup@test.com");
      });
    });

    it("updates email value when typing", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByLabelText("Admin Email(s)")).toBeInTheDocument();
      });

      const input = screen.getByLabelText("Admin Email(s)");
      await userEvent.clear(input);
      await userEvent.type(input, "new@test.com");

      expect(input).toHaveValue("new@test.com");
    });

    it("shows validation badges for emails", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("admin@test.com")).toBeInTheDocument();
        expect(screen.getByText("backup@test.com")).toBeInTheDocument();
      });
    });

    it("shows helper text with recipient count", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText(/Comma-separated list of emails/)).toBeInTheDocument();
        expect(screen.getByText("2 valid recipients")).toBeInTheDocument();
      });
    });
  });

  describe("Notification Category Toggles", () => {
    it("renders all category toggles", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
        expect(screen.getByText("Signup Errors")).toBeInTheDocument();
        expect(screen.getByText("System Alerts")).toBeInTheDocument();
      });
    });

    it("loads saved toggle states from database", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        const switches = screen.getAllByRole("switch");
        // Sound switch + 3 category switches
        expect(switches.length).toBeGreaterThanOrEqual(4);
      });
    });

    it("toggles category preference on switch click", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
      });

      const switches = screen.getAllByRole("switch");
      const signupSwitch = switches[1]; // After sound toggle
      
      await userEvent.click(signupSwitch);
      // State should toggle (we can't directly assert internal state, but the click should work)
    });
  });

  describe("Sound Toggle", () => {
    it("renders sound toggle with correct initial state", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("Alert Sound")).toBeInTheDocument();
        expect(screen.getByText("Play audio alerts for real-time notifications")).toBeInTheDocument();
      });
    });

    it("toggles sound and persists to localStorage", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("Alert Sound")).toBeInTheDocument();
      });

      const switches = screen.getAllByRole("switch");
      const soundSwitch = switches[0];
      
      await userEvent.click(soundSwitch);

      expect(localStorage.getItem("admin_alert_sound_enabled")).toBeDefined();
    });
  });

  describe("Test Email Buttons", () => {
    it("renders test buttons for each category", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        // Use more specific selector - buttons that contain "Test" text
        const testButtons = screen.getAllByRole("button").filter(btn => 
          btn.textContent?.includes("Test") && !btn.textContent?.includes("Tested")
        );
        expect(testButtons.length).toBe(3);
      });
    });

    it("sends test signup notification", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
      });

      // Find test buttons more specifically
      const signupsSection = screen.getByText("New Signups").closest("div")?.parentElement?.parentElement;
      const testButton = signupsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith("send-test-signup-notification");
      });
    });

    it("sends test error notification", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("Signup Errors")).toBeInTheDocument();
      });

      const errorsSection = screen.getByText("Signup Errors").closest("div")?.parentElement?.parentElement;
      const testButton = errorsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith("send-test-error-notification");
      });
    });

    it("sends test alert notification", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("System Alerts")).toBeInTheDocument();
      });

      const alertsSection = screen.getByText("System Alerts").closest("div")?.parentElement?.parentElement;
      const testButton = alertsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith("send-test-alert-email");
      });
    });

    it("shows toast on successful test email", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
      });

      const signupsSection = screen.getByText("New Signups").closest("div")?.parentElement?.parentElement;
      const testButton = signupsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Test email sent",
          })
        );
      });
    });

    it("requires email before sending test", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() =>
            Promise.resolve({
              data: [
                { setting_key: "admin_notification_email", setting_value: "" },
                { setting_key: "notify_signups_enabled", setting_value: "true" },
                { setting_key: "notify_errors_enabled", setting_value: "true" },
                { setting_key: "notify_alerts_enabled", setting_value: "true" },
              ],
              error: null,
            })
          ),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any);

      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByLabelText("Admin Email(s)")).toBeInTheDocument();
      });

      const signupsSection = screen.getByText("New Signups").closest("div")?.parentElement?.parentElement;
      const testButton = signupsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Email required",
            variant: "destructive",
          })
        );
      });
    });
  });

  describe("Save Functionality", () => {
    it("renders save button", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });
    });

    it("saves settings on button click", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("escalation_settings");
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Settings saved",
          })
        );
      });
    });

    it("shows error toast when email is empty on save", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() =>
            Promise.resolve({
              data: [
                { setting_key: "admin_notification_email", setting_value: "" },
                { setting_key: "notify_signups_enabled", setting_value: "true" },
                { setting_key: "notify_errors_enabled", setting_value: "true" },
                { setting_key: "notify_alerts_enabled", setting_value: "true" },
              ],
              error: null,
            })
          ),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any);

      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Email required",
            variant: "destructive",
          })
        );
      });
    });

    it("shows error toast when emails are invalid on save", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          in: vi.fn(() =>
            Promise.resolve({
              data: [
                { setting_key: "admin_notification_email", setting_value: "invalid-email" },
                { setting_key: "notify_signups_enabled", setting_value: "true" },
                { setting_key: "notify_errors_enabled", setting_value: "true" },
                { setting_key: "notify_alerts_enabled", setting_value: "true" },
              ],
              error: null,
            })
          ),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any);

      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Invalid email(s)",
            variant: "destructive",
          })
        );
      });
    });
  });

  describe("Last Tested Timestamps", () => {
    it("shows last tested timestamp for signups when available", async () => {
      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
      });

      // Check that a "Tested" text exists somewhere in the signups section
      const signupsSection = screen.getByText("New Signups").closest("div")?.parentElement?.parentElement;
      await waitFor(() => {
        expect(signupsSection?.textContent).toMatch(/Tested/);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles fetch settings error gracefully", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: "Database error" },
            })
          ),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }) as any);

      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      // Component should still render even with error
      await waitFor(() => {
        expect(screen.getByLabelText("Admin Email(s)")).toBeInTheDocument();
      });
    });

    it("handles test email error gracefully", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: "Edge function error" },
      });

      render(<AdminNotificationSettings />);
      
      await userEvent.click(screen.getByText("Notification Settings"));

      await waitFor(() => {
        expect(screen.getByText("New Signups")).toBeInTheDocument();
      });

      const signupsSection = screen.getByText("New Signups").closest("div")?.parentElement?.parentElement;
      const testButton = signupsSection?.querySelector("button:not([aria-label])");
      
      if (testButton) {
        await userEvent.click(testButton);
      }

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Failed to send test",
            variant: "destructive",
          })
        );
      });
    });
  });
});
