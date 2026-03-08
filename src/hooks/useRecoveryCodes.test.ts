import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecoveryCodes } from "./useRecoveryCodes";

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
};

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockSupabase.from(...args),
    rpc: (...args: any[]) => mockSupabase.rpc(...args),
    functions: {
      invoke: (...args: any[]) => mockSupabase.functions.invoke(...args),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/mfaEventTracking", () => ({
  trackMFAVerificationEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("useRecoveryCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useRecoveryCodes());
    expect(result.current.codes).toEqual([]);
    expect(result.current.generatedCodes).toEqual([]);
    expect(result.current.unusedCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.rateLimited).toBe(false);
    expect(result.current.retryAfterSeconds).toBe(0);
    expect(result.current.attemptsInWindow).toBe(0);
    expect(result.current.remainingAttempts).toBe(5);
  });

  it("fetchUnusedCount updates unusedCount", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ count: 3, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useRecoveryCodes());
    await act(async () => {
      await result.current.fetchUnusedCount();
    });

    expect(result.current.unusedCount).toBe(3);
  });

  it("generateRecoveryCodes uses backend function and stores returned codes", async () => {
    const codes = Array.from({ length: 10 }, (_, i) => `ABCD-${(1000 + i).toString()}`);
    mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true, codes }, error: null });

    const { result } = renderHook(() => useRecoveryCodes());
    let res: any;
    await act(async () => {
      res = await result.current.generateRecoveryCodes();
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("generate-recovery-codes");
    expect(res.success).toBe(true);
    expect(result.current.generatedCodes).toEqual(codes);
    expect(result.current.unusedCount).toBe(10);
  });

  it("generateRecoveryCodes returns error when invoke fails", async () => {
    mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: new Error("Invoke failed") });

    const { result } = renderHook(() => useRecoveryCodes());
    let res: any;
    await act(async () => {
      res = await result.current.generateRecoveryCodes();
    });

    expect(res.success).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("blocks verification when rate limited", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 300, attempts_in_window: 5 }],
      error: null,
    });

    const { result } = renderHook(() => useRecoveryCodes());
    let res: any;
    await act(async () => {
      res = await result.current.verifyRecoveryCode("ABCD-1234");
    });

    expect(res.success).toBe(false);
    expect(res.rateLimited).toBe(true);
    expect(result.current.rateLimited).toBe(true);
    expect(result.current.remainingAttempts).toBe(0);
  });

  it("verifies successfully via backend function and records a successful attempt", async () => {
    mockSupabase.rpc.mockImplementation((fn: string, args: any) => {
      if (fn === "check_recovery_code_rate_limit") {
        return Promise.resolve({
          data: [{ allowed: true, retry_after_seconds: 0, attempts_in_window: 2 }],
          error: null,
        });
      }
      if (fn === "record_recovery_code_attempt") {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
    mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useRecoveryCodes());
    let res: any;
    await act(async () => {
      res = await result.current.verifyRecoveryCode("ABCD-1234");
    });

    expect(res.success).toBe(true);
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("verify-recovery-code", {
      body: { code: "ABCD-1234" },
    });
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      "record_recovery_code_attempt",
      expect.objectContaining({ p_user_id: mockUser.id, p_success: true })
    );
  });

  it("returns invalid for bad code and updates remainingAttempts", async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 0, attempts_in_window: 3 }],
      error: null,
    });
    mockSupabase.functions.invoke.mockResolvedValue({ data: { success: false }, error: null });

    const { result } = renderHook(() => useRecoveryCodes());
    let res: any;
    await act(async () => {
      res = await result.current.verifyRecoveryCode("BAD-CODE");
    });

    expect(res.success).toBe(false);
    expect(res.remainingAttempts).toBe(1); // 5 - (3 + 1)
    expect(result.current.remainingAttempts).toBe(1);
    expect(result.current.attemptsInWindow).toBe(4);
  });

  it("clearDisplayedCodes clears generated codes", async () => {
    const codes = Array.from({ length: 10 }, (_, i) => `ABCD-${(1000 + i).toString()}`);
    mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true, codes }, error: null });

    const { result } = renderHook(() => useRecoveryCodes());
    await act(async () => {
      await result.current.generateRecoveryCodes();
    });

    expect(result.current.generatedCodes.length).toBeGreaterThan(0);

    await act(async () => {
      result.current.clearDisplayedCodes();
    });

    expect(result.current.generatedCodes).toEqual([]);
  });
});
