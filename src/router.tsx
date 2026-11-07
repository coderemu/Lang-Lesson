import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell";
import { Home } from "./routes/Home";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

/** Shown while the code of a screen loads (the first visit of a screen, and only without the cache). */
const Loading = () => (
  <p role="status" style={{ padding: 24, color: "var(--color-ink-soft)" }}>
    Loading…
  </p>
);

/**
 * Home and the shell are in the first chunk (NFR-06). Every other screen is its own chunk: it loads on first use,
 * and the service worker precaches all of them, so the app still works offline.
 */
export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      HydrateFallback: Loading,
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/progress",
          lazy: async () => ({ Component: (await import("./routes/Progress")).Progress }),
        },
        {
          path: "/rules",
          lazy: async () => ({ Component: (await import("./routes/RuleBook")).RuleBook }),
        },
        {
          path: "/coverage",
          lazy: async () => ({ Component: (await import("./routes/Coverage")).Coverage }),
        },
        {
          path: "/settings",
          lazy: async () => ({ Component: (await import("./routes/Settings")).Settings }),
        },
      ],
    },
    {
      path: "/lesson/:id",
      HydrateFallback: Loading,
      lazy: async () => ({ Component: (await import("./engine/LessonPlayer")).LessonPlayer }),
    },
    {
      path: "/practice/:id",
      HydrateFallback: Loading,
      lazy: async () => ({ Component: (await import("./routes/BankOverview")).BankOverview }),
    },
    {
      path: "/practice/:id/:n",
      HydrateFallback: Loading,
      lazy: async () => ({ Component: (await import("./engine/PracticePlayer")).PracticePlayer }),
    },
    {
      path: "/design-system",
      HydrateFallback: Loading,
      lazy: async () => ({ Component: (await import("./routes/DesignSystem")).DesignSystem }),
    },
  ],
  { basename },
);
