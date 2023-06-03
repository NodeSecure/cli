// Import Node.js Dependencies
import { test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { bodyParser } from "../src/http-server/bodyParser.js";

function fakeReq(headers = {}) {
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
  const body = await bodyParser(fakeReq({ "content-type": "application/json" }));

  assert.deepEqual(body, { name: "test" });
});

test("should not parse body", async() => {
  const req = fakeReq();
  const body = await bodyParser(fakeReq());

  assert.deepEqual(body, JSON.stringify({ name: "test" }));
});
