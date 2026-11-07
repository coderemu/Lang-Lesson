import { matchPath, useLocation } from "react-router-dom";
import { BookIcon, HomeIcon, ProgressIcon } from "../components";

export const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: HomeIcon, match: ["/"] },
  {
    to: "/progress",
    label: "Progress",
    Icon: ProgressIcon,
    match: ["/progress", "/coverage", "/settings"],
  },
  { to: "/rules", label: "Rule book", Icon: BookIcon, match: ["/rules"] },
] as const;

export function useActiveNav(): string {
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((n) =>
    n.match.some((p) => matchPath({ path: p, end: true }, pathname)),
  );
  return item?.to ?? "/";
}
