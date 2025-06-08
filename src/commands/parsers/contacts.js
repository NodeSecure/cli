export function createContactsParser({ logError, exit }) {
  return (json) => {
    const contacts = parseContacts({ json, logError, exit });
    if (!Array.isArray(contacts)) {
      logError("cli.errors.contacts.should_be_array");
      exit();
    }
    let hasError = false;
    contacts.forEach((contact, i) => {
      if (!contact) {
        hasError = true;
        logError("cli.errors.contacts.should_be_defined", i);
      }
    });
    if (hasError) {
      exit();
    }

    return contacts;
  };
}

function parseContacts({ json, logError, exit }) {
  try {
    return JSON.parse(json);
  }
  catch (err) {
    logError("cli.errors.contacts.should_be_valid_json", err.message);
    exit();

    return null;
  }
}
