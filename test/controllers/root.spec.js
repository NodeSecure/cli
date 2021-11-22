// Import Third-party Dependencies
import test from "tape";
import { spy } from "sinon";

// Import internal dependencies
import { root } from "../../src/http-server/root.js";

const resObject = {
  writeHead: spy(),
  send: spy(),
  getHeader: spy(),
  end: spy()
};


test("it should set 'Content-Type' headers to 200", async(tape) => {
  await root({}, resObject);

  tape.ok(resObject.writeHead.called);
});
