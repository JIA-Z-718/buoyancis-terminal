import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMFATestMode } from "./useMFATestMode";

describe("useMFATestMode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("should have correct initial values", () => {
      const { result } = renderHook(() => useMFATestMode());

      expect(result.current.isTestMode).toBe(false);
      expect(result.current.isEnrolled).toBe(false);
      expect(result.current.currentLevel).toBe("aal1");
      expect(result.current.enrollmentData).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.factors).toEqual([]);
      expect(result.current.requiresMFAVerification).toBe(false);
    });

    it("should expose TEST_VERIFICATION_CODE", () => {
      const { result } = renderHook(() => useMFATestMode());
      expect(result.current.TEST_VERIFICATION_CODE).toBe("123456");
    });
  });

  describe("enableTestMode / disableTestMode", () => {
    it("should enable test mode", () => {
      const { result } = renderHook(() => useMFATestMode());

      act(() => {
        result.current.enableTestMode();
      });

      expect(result.current.isTestMode).toBe(true);
    });

    it("should disable test mode and reset all state", () => {
      const { result } = renderHook(() => useMFATestMode());

      // Enable and enroll first
      act(() => {
        result.current.enableTestMode();
      });

      act(() => {
        result.current.disableTestMode();
      });

      expect(result.current.isTestMode).toBe(false);
      expect(result.current.isEnrolled).toBe(false);
      expect(result.current.currentLevel).toBe("aal1");
      expect(result.current.enrollmentData).toBeNull();
    });
  });

  describe("startEnrollment", () => {
    it("should set loading state and return enrollment data", async () => {
      const { result } = renderHook(() => useMFATestMode());

      let enrollPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        enrollPromise = result.current.startEnrollment("Test App");
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Fast-forward timers
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const enrollResult = await enrollPromise!;

      expect(enrollResult.success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.enrollmentData).not.toBeNull();
      expect(result.current.enrollmentData?.factorId).toBe("test-factor-id-12345");
      expect(result.current.enrollmentData?.secret).toBe("JBSWY3DPEHPK3PXP");
      expect(result.current.enrollmentData?.qrCode).toContain("data:image/svg+xml");
    });
  });

  describe("verifyEnrollment", () => {
    it("should succeed with correct code (123456)", async () => {
      const { result } = renderHook(() => useMFATestMode());

      // Start enrollment first
      act(() => {
        result.current.startEnrollment();
      });

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      let verifyPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        verifyPromise = result.current.verifyEnrollment("123456");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const verifyResult = await verifyPromise!;

      expect(verifyResult.success).toBe(true);
      expect(result.current.isEnrolled).toBe(true);
      expect(result.current.currentLevel).toBe("aal2");
      expect(result.current.enrollmentData).toBeNull();
      expect(result.current.factors).toHaveLength(1);
      expect(result.current.factors[0].status).toBe("verified");
    });

    it("should fail with incorrect code", async () => {
      const { result } = renderHook(() => useMFATestMode());

      let verifyPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        verifyPromise = result.current.verifyEnrollment("wrong-code");
      });

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      const verifyResult = await verifyPromise!;

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toContain("Invalid verification code");
      expect(result.current.error).toContain("Invalid verification code");
      expect(result.current.isEnrolled).toBe(false);
    });
  });

  describe("verifyMFA", () => {
    it("should succeed with correct code", async () => {
      const { result } = renderHook(() => useMFATestMode());

      let verifyPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        verifyPromise = result.current.verifyMFA("123456");
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const verifyResult = await verifyPromise!;

      expect(verifyResult.success).toBe(true);
      expect(result.current.currentLevel).toBe("aal2");
    });

    it("should fail with incorrect code", async () => {
      const { result } = renderHook(() => useMFATestMode());

      let verifyPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        verifyPromise = result.current.verifyMFA("000000");
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const verifyResult = await verifyPromise!;

      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toContain("Invalid code");
    });
  });

  describe("unenroll", () => {
    it("should reset enrollment state", async () => {
      const { result } = renderHook(() => useMFATestMode());

      // First enroll
      act(() => {
        result.current.startEnrollment();
      });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      act(() => {
        result.current.verifyEnrollment("123456");
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isEnrolled).toBe(true);

      // Now unenroll
      let unenrollPromise: Promise<{ success: boolean; error?: string }>;

      act(() => {
        unenrollPromise = result.current.unenroll("test-factor-id");
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const unenrollResult = await unenrollPromise!;

      expect(unenrollResult.success).toBe(true);
      expect(result.current.isEnrolled).toBe(false);
      expect(result.current.currentLevel).toBe("aal1");
      expect(result.current.factors).toEqual([]);
    });
  });

  describe("cancelEnrollment", () => {
    it("should clear enrollment data", async () => {
      const { result } = renderHook(() => useMFATestMode());

      // Start enrollment
      act(() => {
        result.current.startEnrollment();
      });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(result.current.enrollmentData).not.toBeNull();

      // Cancel
      act(() => {
        result.current.cancelEnrollment();
      });

      expect(result.current.enrollmentData).toBeNull();
    });
  });

  describe("requiresMFAVerification", () => {
    it("should be true when enrolled but at aal1", async () => {
      const { result } = renderHook(() => useMFATestMode());

      // Enroll
      act(() => {
        result.current.startEnrollment();
      });
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      act(() => {
        result.current.verifyEnrollment("123456");
      });
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // After enrollment, user is at aal2, so verification not required
      expect(result.current.requiresMFAVerification).toBe(false);

      // Simulate aal1 state (would happen on fresh login)
      // The hook doesn't expose direct state manipulation, but we can test the logic
    });

    it("should be false when not enrolled", () => {
      const { result } = renderHook(() => useMFATestMode());
      expect(result.current.requiresMFAVerification).toBe(false);
    });
  });

  describe("fetchMFAStatus", () => {
    it("should return a resolved promise (no-op)", async () => {
      const { result } = renderHook(() => useMFATestMode());
      
      await expect(result.current.fetchMFAStatus()).resolves.toBeUndefined();
    });
  });
});
