// Import Node.js Dependencies
import { describe, test } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { bodyParser } from "../src/endpoints/util/bodyParser.ts";

function generateFakeReq(headers = {}): any {
  return {
    headers,
    async* [Symbol.asyncIterator]() {
      yield "{";
      yield "\"name\":\"test\"";
      yield "}";
    }
  };
}

describe("bodyParser", () => {
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
});
