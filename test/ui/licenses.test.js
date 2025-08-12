// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { selectLicenses } from "../../public/components/package/pannels/licenses/view-model.js";

describe("select licenses", () => {
  it("should have no licenses", () => {
    const licenses = [];
    assert.deepEqual(selectLicenses(licenses, "./"), []);
  });

  it("should select a licences with spdx ✔️", () => {
    const licenses = [
      {
        licenses: {
          "Apache-2.0": "https://spdx.org/licenses/Apache-2.0.html#licenseText"
        },
        spdx: {
          osi: true,
          fsf: true,
          fsfAndOsi: true,
          includesDeprecated: true
        },
        from: "package.json"
      }
    ];
    assert.deepEqual(selectLicenses(licenses, "./"), [{
      title: "Apache-2.0",
      spdx: ["✔️ osi", "✔️ fsf", "✔️ fsfAndOsi", "✔️ includesDeprecated"],
      fileName: "package.json",
      fileHref: "./package.json",
      titleHref: "https://spdx.org/licenses/Apache-2.0.html#licenseText"
    }]);
  });

  it("should select a licences with spdx ❌", () => {
    const licenses = [
      {
        licenses: {
          "Apache-3.0": "https://spdx.org/licenses/Apache-3.0.html#licenseText"
        },
        spdx: {
          osi: false,
          fsf: false,
          fsfAndOsi: false,
          includesDeprecated: false
        },
        from: "/package.json"
      }
    ];
    assert.deepEqual(selectLicenses(licenses, ".."), [{
      title: "Apache-3.0",
      spdx: ["❌ osi", "❌ fsf", "❌ fsfAndOsi", "❌ includesDeprecated"],
      fileName: "/package.json",
      fileHref: "../package.json",
      titleHref: "https://spdx.org/licenses/Apache-3.0.html#licenseText"
    }]);
  });

  it("should drop duplicates", () => {
    const licenses = [
      {
        licenses: {
          "Apache-3.0": "https://spdx.org/licenses/Apache-3.0.html#licenseText"
        },
        spdx: {
          osi: false,
          fsf: false,
          fsfAndOsi: false,
          includesDeprecated: false
        },
        from: "/package.json"
      },
      {
        licenses: {
          "Apache-3.0": "https://spdx.org/licenses/Apache-3.0.html#licenseText"
        },
        spdx: {
          osi: false,
          fsf: false,
          fsfAndOsi: false,
          includesDeprecated: false
        },
        from: "/package.json"
      }
    ];

    assert.deepEqual(selectLicenses(licenses, ".."), [{
      title: "Apache-3.0",
      spdx: ["❌ osi", "❌ fsf", "❌ fsfAndOsi", "❌ includesDeprecated"],
      fileName: "/package.json",
      fileHref: "../package.json",
      titleHref: "https://spdx.org/licenses/Apache-3.0.html#licenseText"
    }]);
  });
});
