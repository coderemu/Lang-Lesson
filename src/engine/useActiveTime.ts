import { useEffect } from "react";
import { useProgress } from "../store";

const TICK_S = 5;
const IDLE_S = 120;

/**
 * FR-80a: count time only while the page is visible and the learner acted in the last 2 minutes.
 * Call once in a player screen.
 */
export function useActiveTime(): void {
  const addSeconds = useProgress((s) => s.addSeconds);
  useEffect(() => {
    let last = Date.now();
    const touch = () => {
      last = Date.now();
    };
    const events = ["pointerdown", "keydown", "input", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - last < IDLE_S * 1000) {
        addSeconds(TICK_S);
      }
    }, TICK_S * 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [addSeconds]);
}
