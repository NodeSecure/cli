// Import Node.js Dependencies
import assert from "node:assert";
import { test } from "node:test";

// Import Internal Dependencies
import NodeSecureDataSet from "../src/dataset.js";
import { getDataSetPayload } from "./dataset.fixture.js";

const dataSetPayload = await getDataSetPayload();

global.window = {
  settings: {
    config: {
      showFriendlyDependencies: true
    }
  }
};

test("NodeSecureDataSet.init with given payload", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);
  assert.equal(nsDataSet.data, dataSetPayload, "should set data");
});

test("NodeSecureDataSet.init should fetch data & flags from the network", async() => {
  global.fetch = (path) => Promise.resolve({ json: () => (path === "/data" ? dataSetPayload : "FLAG_01") });

  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init();

  assert.equal(nsDataSet.data, dataSetPayload, "should fetch data");
  assert.equal(nsDataSet.FLAGS, "FLAG_01", "should fetch flags");
});

test("NodeSecureDataSet.init should compute extensions", async() => {
  const nsDataSet = new NodeSecureDataSet();
  assert.equal(Object.keys(nsDataSet.extensions).length, 0, "should have 0 extensions");

  await nsDataSet.init();

  assert.equal(Object.keys(nsDataSet.extensions).length, 5, "should have 2 extension (js and json)");
  assert.equal(nsDataSet.extensions[".js"], 4, "should have 2 '.js' extensions'");
});

test("NodeSecureDataSet.init should compute licenses", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init();
  assert.equal(Object.keys(nsDataSet.licenses).length, 2, "should have 2 licenses (MIT, RND)");
  assert.equal(nsDataSet.licenses.MIT, 2, "should have 2 MIT licenses");
  assert.equal(nsDataSet.licenses.RND, 1, "should have 1 RND license");
});
test("NodeSecureDataSet.prettySize", () => {
  const nsDataSet = new NodeSecureDataSet();
  nsDataSet.size = 1337;
  assert.equal(nsDataSet.prettySize, "1.34 kB", "should convert bytes to human readable string");
});

test("NodeSecureDataSet.isHighlighted", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);
  assert.equal(nsDataSet.isHighlighted({ name: "Unknown" }), false, "should not be hightlighted");
  assert.equal(nsDataSet.isHighlighted({ name: "Sindre Sorhus" }), true, "name: Sindre Sorhus should be hightlighted");
  assert.equal(nsDataSet.isHighlighted({ name: "Rich Harris" }), true, "name: Rich Harris should be hightlighted");
  assert.equal(nsDataSet.isHighlighted({ email: "rich.harris@gmail.com" }),
    true,
    "email: rich.harris@gmail.com should be hightlighted");

  assert.equal(nsDataSet.isHighlighted({ email: "gentilhomme.thomas@gmail.com" }),
    true,
    "email: gentilhomme.thomas@gmail.com should be hightlighted");
});

test("NodeSecureDataSet.init should mark highlighted packages by name", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);

  const pkg3Packages = nsDataSet.findPackagesByName("pkg3");
  assert.ok(pkg3Packages.length > 0, "should have pkg3 packages");
  assert.ok(pkg3Packages.every((pkg) => pkg.isHighlighted), "all pkg3 versions should be highlighted (matched by name)");
});

test("NodeSecureDataSet.init should mark highlighted packages by name@version", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);

  const pkg2Packages = nsDataSet.findPackagesByName("pkg2");
  const highlighted = pkg2Packages.find((pkg) => pkg.version === "1.0.4");
  const notHighlighted = pkg2Packages.find((pkg) => pkg.version === "1.0.3");

  assert.ok(highlighted, "should find pkg2@1.0.4");
  assert.equal(highlighted.isHighlighted, true, "pkg2@1.0.4 should be highlighted (matched by name@version)");
  assert.equal(notHighlighted.isHighlighted, false, "pkg2@1.0.3 should not be highlighted");
});

test("NodeSecureDataSet.init should not highlight packages absent from highlighted list", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);

  const pkg1Packages = nsDataSet.findPackagesByName("pkg1");
  assert.ok(pkg1Packages.length > 0, "should have pkg1 packages");
  assert.ok(pkg1Packages.every((pkg) => !pkg.isHighlighted), "pkg1 should not be highlighted");
});

test("NodeSecureDataSet.computeAuthors", () => {
  const nsDataSet = new NodeSecureDataSet();
  nsDataSet.computeAuthor({ name: "John Doe" }, "pkg@1.1");
  assert.equal(nsDataSet.authors.get("John Doe").packages.size, 1, "should have 1 author: John Doe");

  nsDataSet.computeAuthor({ name: "John Doe" }, "pkg@1.2");

  assert.equal(nsDataSet.authors.size, 1, "should have 1 author: John Doe (after the 2nd contribution");
  assert.equal(nsDataSet.authors.get("John Doe").packages.size, 2, "should have 1 author: John Doe (2nd time)");
});

test("NodeSecureDataSet.build", () => {
  const nsDataSet = new NodeSecureDataSet();
  nsDataSet.rawEdgesData = [
    { id: 1, text: "item 1" },
    { id: 2, text: "item 2" },
    { id: 3, text: "item 3" }
  ];
  nsDataSet.rawNodesData = [
    { from: 1, to: 2, id: "A" },
    { from: 2, to: 3, id: "B" }
  ];
  const builtData = nsDataSet.build();

  assert.equal(builtData.nodes.length, 2, "should have 2 nodes");
  assert.equal(builtData.edges.length, 3, "should have 3 edges");
});

test("NodeSecureDataSet.findPackagesByName should have no packages when no name matches", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);

  assert.equal(nsDataSet.findPackagesByName("unknown").length, 0, "should have no packages");
});

test("NodeSecureDataSet.findPackagesByName should have packages when name matches", async() => {
  const nsDataSet = new NodeSecureDataSet();
  await nsDataSet.init(dataSetPayload);
  const packages = nsDataSet.findPackagesByName("pkg2");

  const expectedPackages = [
    {
      id: undefined,
      name: "pkg2",
      version: "1.0.3",
      hasWarnings: false,
      flags: "",
      links: undefined,
      isFriendly: 0,
      isHighlighted: false
    },
    {
      id: undefined,
      name: "pkg2",
      version: "1.0.4",
      hasWarnings: false,
      flags: "",
      links: undefined,
      isFriendly: 0,
      isHighlighted: true

    }
  ];

  assert.deepEqual(packages, expectedPackages, "should all versions by name");
});
