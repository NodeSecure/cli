// Import Node.js Dependencies
import { test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { bodyParser } from "../src/http-server/bodyParser.js";

function generateFakeReq(headers = {}) {
  return {
    headers,
    async* [Symbol.asyncIterator]() {
      yield "{";
      yield "\"name\":\"test\"";
      yield "}";
    }
  };
}

test("should parse body", async() => {
  const req = generateFakeReq({ "content-type": "application/json" });
  const body = await bodyParser(req);

  assert.deepEqual(body, { name: "test" });
});

test("should not parse body", async() => {
  const reqWithNoHeaders = generateFakeReq();
  const body = await bodyParser(reqWithNoHeaders);

  assert.deepEqual(body, JSON.stringify({ name: "test" }));
});
