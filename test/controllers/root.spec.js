// Import Third-party Dependencies
import test from "tape";
import { spy, stub } from "sinon";

// Import internal dependencies
import { root, buildHtml } from "../../src/http-server/root.js";

const resObject = {
  writeHead: spy(),
  send: spy(),
  getHeader: spy(),
  end: spy()
};


test("it should set 'Content-Type' headers to html/text", async(tape) => {
  await root({}, resObject);

  const expectedHeaders = { "Content-Type": "text/html" };
  const isCalledRight = resObject.writeHead.calledWith(200, expectedHeaders);
  tape.ok(isCalledRight, "should be called with 200, and content-type");
});

test("it should send render html page", async(tape) => {
  await root({}, resObject);

  const expectedHtml = await buildHtml();
  const isCalledRight = resObject.end.calledWith(expectedHtml);
  tape.ok(isCalledRight, "call the end method with html");
});

test("it could send an error if something goes wrong", async(tape) => {
  tape.plan(1);

  try {
    await root({}, {
      ...resObject,
      writeHead: stub().throws()
    });
  }
  catch {
    tape.ok(resObject.end.called);
  }
});
