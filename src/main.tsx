import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "./shared/styles/Globals.css";
import "./shared/styles/Layout.css";
import "./shared/styles/Header.css";
import "./shared/styles/Footer.css";

import "./shared/styles/tokens.css";
import "./shared/styles/ui.css";
import "./shared/styles/tm-layout.css";
import "./shared/styles/patterns.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
