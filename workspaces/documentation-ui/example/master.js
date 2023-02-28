import * as documentationUI from "../index.js";

document.addEventListener("DOMContentLoaded", async() => {
  const result = documentationUI.render(document.getElementById("main"), {
    prefetch: true
  });

  // setTimeout(() => {
  //   result.header.setNewActiveView("warnings");

  //   result.navigation.warnings.setNewActiveMenu("unsafe-stmt");
  // }, 3_000);
});
