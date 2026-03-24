/// <reference types="vite/client" />

// Import Internal Dependencies
import "../src/css/main.css";
import * as documentationUI from "../src/index.js";

document.addEventListener("DOMContentLoaded", () => {
  const mainElement = document.getElementById("main");
  if (!mainElement) {
    throw new Error("Main element not found");
  }

  documentationUI.render(mainElement, {
    prefetch: true
  });
});
