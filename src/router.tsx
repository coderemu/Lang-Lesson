import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell";
import { Coverage, Home, Lesson, Practice, Progress, RuleBook, Settings } from "./routes/pages";
import { DesignSystem } from "./routes/DesignSystem";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/progress", element: <Progress /> },
        { path: "/rules", element: <RuleBook /> },
        { path: "/coverage", element: <Coverage /> },
        { path: "/settings", element: <Settings /> },
      ],
    },
    { path: "/lesson/:id", element: <Lesson /> },
    { path: "/practice/:id", element: <Practice /> },
    { path: "/design-system", element: <DesignSystem /> },
  ],
  { basename },
);
