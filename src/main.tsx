import "@vitejs/plugin-react/preamble";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support for the local-first shell; registration failure is non-fatal.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
