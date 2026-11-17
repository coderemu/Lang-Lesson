import { useEffect, useState } from "react";
import { loadMath, mathLoaded } from "./check/expr";

/** Load mathjs (its own chunk) when a screen needs it. Returns true when it is ready. */
export function useMath(needed: boolean): boolean {
  const [ready, setReady] = useState(mathLoaded());
  useEffect(() => {
    if (!needed || ready) return;
    let live = true;
    void loadMath().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [needed, ready]);
  return !needed || ready;
}
