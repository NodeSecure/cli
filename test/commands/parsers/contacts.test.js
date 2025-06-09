// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import Internal Dependencies
import { parseContacts } from "../../../src/commands/parsers/contacts.js";

describe("contacts parser", () => {
  it("should have no contacts", () => {
    assert.deepEqual(parseContacts(""), []);
  });

  it("should have a contact with a name", () => {
    assert.deepEqual(parseContacts("sindre"), [{ name: "sindre" }]);
  });

  it("should trim names", () => {
    assert.deepEqual(parseContacts("  matteo "), [{ name: "matteo" }]);
  });

  it("should have a contact with an email", () => {
    assert.deepEqual(parseContacts("matteo@gmail.com"), [{ email: "matteo@gmail.com" }]);
  });

  it("should trim emails", () => {
    assert.deepEqual(parseContacts("  sindre@gmail.com "), [{ email: "sindre@gmail.com" }]);
  });

  it("should parse names and emails", () => {
    assert.deepEqual(parseContacts("sindre sindre@gmail.com"), [{ name: "sindre", email: "sindre@gmail.com" }]);
  });

  it("should parse multiples contacts", () => {
    assert.deepEqual(parseContacts("sindre sindre@gmail.com, matteo"),
      [{ name: "sindre", email: "sindre@gmail.com" }, { name: "matteo" }]);
  });
});

