import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";
import { router } from "./router";
import { UpdateToast } from "./shell/UpdateToast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <UpdateToast />
  </StrictMode>,
);
