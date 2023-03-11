// Import Internal Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "../index.js";
import payload from "./payload.json";

document.addEventListener("DOMContentLoaded", async() => {
  const secureDataSet = new NodeSecureDataSet();
  // const secureDataSet = new NodeSecureDataSet({
  //   flagsToIgnore: ["🌲"],
  //   warningsToIgnore: ["unsafe-regex", "encoded-literal", "unsafe-stmt"]
  // });
  await secureDataSet.init(payload, window.FLAGS);

  new NodeSecureNetwork(secureDataSet, {
    theme: "LIGHT"
  });
});
