// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { selectVisibleItems } from "../../public/components/items-list/view-model.js";

describe("select visible items", () => {
  it("should show all visible items", () => {
    const items = [".js", ".css", ".html", ".json", ".txt", ".xml"];
    const isClosed = false;
    const itemsToShowLength = 5;
    assert.deepEqual(selectVisibleItems({
      items, isClosed, itemsToShowLength
    }), items);
  });

  it("should remove empty string", () => {
    const items = [".js", ".css", "", ".json", ".txt", "  "];
    const isClosed = false;
    const itemsToShowLength = 5;
    assert.deepEqual(selectVisibleItems({
      items, isClosed, itemsToShowLength
    }), [".js", ".css", ".json", ".txt"]);
  });

  it("should keep only the n visible items", () => {
    const items = [".js", " ", "", ".json", ".txt", ".png"];
    const isClosed = true;
    assert.deepEqual(selectVisibleItems({
      items, isClosed, itemsToShowLength: 2
    }), [".js", ".json"]);
    assert.deepEqual(selectVisibleItems({
      items, isClosed, itemsToShowLength: 1
    }), [".js"]);
  });

  it("should keep all the items visible regardless of the items to show", () => {
    const items = [".js", " ", "", ".json", ".txt", ".png"];
    const isClosed = true;
    assert.deepEqual(selectVisibleItems({
      items, isClosed, itemsToShowLength: 1,
      shouldShowEveryItems: true
    }), [".js", ".json", ".txt", ".png"]);
  });
});
