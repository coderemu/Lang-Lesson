import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./shell";
import { Coverage, Home, Progress, RuleBook, Settings } from "./routes/pages";
import { LessonPlayer } from "./engine/LessonPlayer";
import { PracticePlayer } from "./engine/PracticePlayer";
import { BankOverview } from "./routes/BankOverview";
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
    { path: "/lesson/:id", element: <LessonPlayer /> },
    { path: "/practice/:id", element: <BankOverview /> },
    { path: "/practice/:id/:n", element: <PracticePlayer /> },
    { path: "/design-system", element: <DesignSystem /> },
  ],
  { basename },
);
