// Import Node.js Dependencies
import { it, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Import Internal Dependencies
import { createContactsParser } from "../../../src/commands/parsers/contacts.js";

let errors = [];

function exit() {
  throw new Error("process exited");
}

beforeEach(() => {
  errors = [];
});

function logError(token, param) {
  if (param) {
    errors.push(`${token} ${param}`);
  }
  else {
    errors.push(token);
  }
}

describe("contacts parser", () => {
  it("should successfully parse the contacts to highlight", () => {
    const parseContacts = createContactsParser({
      logError,
      exit
    });

    const contactsJson = "[{\"name\": \"contact1\"},{\"name\":\"contact2\",\"url\":\"url2\",\"email\":\"email2@gmail.com\"}]";
    const result = [{ name: "contact1" }, { name: "contact2", url: "url2", email: "email2@gmail.com" }];
    assert.deepEqual(parseContacts(contactsJson), result);
    assert.deepEqual(errors, []);
  });

  describe("errors", () => {
    it("should display an error and exit the process when the contacts is not valid json", () => {
      const parseContacts = createContactsParser({
        logError,
        exit
      });

      const unvalidJson = "][";

      assert.throws(() => parseContacts(unvalidJson), { message: "process exited" });
      assert.deepEqual(errors, ["cli.errors.contacts.should_be_valid_json Unexpected token ']', \"][\" is not valid JSON"]);
    });

    it("should display an error and exit the process when the contacts is not an array", () => {
      const parseContacts = createContactsParser({
        logError,
        exit
      });

      const contactsJson = "{\"name\":\"contact1\"}";

      assert.throws(() => parseContacts(contactsJson), { message: "process exited" });
      assert.deepEqual(errors, ["cli.errors.contacts.should_be_array"]);
    });

    it("should display an error when a contact is null", () => {
      const parseContacts = createContactsParser({
        logError,
        exit
      });

      const contactsJson = "[{\"name\": \"contact1\"},null,{\"name\":\"contact2\"," +
        "\"url\":\"url2\",\"email\":\"email2@gmail.com\"},null]";
      assert.throws(() => parseContacts(contactsJson), { message: "process exited" });
      assert.deepEqual(errors, ["cli.errors.contacts.should_be_defined 1", "cli.errors.contacts.should_be_defined 3"]);
    });
  });
});

