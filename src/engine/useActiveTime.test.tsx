import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDate, useProgress } from "../store";
import { useActiveTime } from "./useActiveTime";

beforeEach(() => {
  vi.useFakeTimers();
  useProgress.getState().reset();
});
afterEach(() => vi.useRealTimers());

describe("useActiveTime (FR-80a)", () => {
  it("counts time while the learner acts and stops after 2 minutes of silence", () => {
    renderHook(() => useActiveTime());
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(useProgress.getState().seconds[localDate()]).toBe(10);
    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
      vi.advanceTimersByTime(60_000);
    });
    expect(useProgress.getState().seconds[localDate()]).toBe(70);
    act(() => {
      vi.advanceTimersByTime(300_000);
    });
    // Idle: it stops 120 s after the last action.
    expect(useProgress.getState().seconds[localDate()]).toBeLessThanOrEqual(70 + 120);
    expect(useProgress.getState().seconds[localDate()]).toBeGreaterThan(70);
  });
  it("does not count while the page is hidden", () => {
    const spy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    renderHook(() => useActiveTime());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(useProgress.getState().seconds[localDate()]).toBeUndefined();
    spy.mockRestore();
  });
});
