import { useEffect, useState } from "react";
import type { Coverage, PracticeBank, Rule } from "../../content/schema";
import { bankIds, loadBank, loadCoverage, loadRules } from "./load";

/** Run an async loader once. Returns undefined while loading. */
export function useLoaded<T>(load: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let live = true;
    void load().then((v) => live && setValue(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export const useRules = (): Rule[] | undefined => useLoaded(loadRules);
export const useCoverage = (): Coverage | undefined => useLoaded(loadCoverage);

/** All banks that exist, by lesson id. */
export function useBanks(): Map<string, PracticeBank> | undefined {
  return useLoaded(async () => {
    const entries = await Promise.all(
      bankIds().map(async (id) => [id, await loadBank(id)] as const),
    );
    return new Map(entries.filter((e): e is [string, PracticeBank] => e[1] !== null));
  });
}

/** True from 900 px (desktop layout). */
export function useDesktop(): boolean {
  const query = "(min-width: 900px)";
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return match;
}
