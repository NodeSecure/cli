export function parseContacts(str) {
  return str ? str.split(",").map(parseContact) : [];
}

function parseContact(str) {
  const emailMatch = str.match(emailRegex());
  if (!emailMatch) {
    return { name: str.trim() };
  }
  const email = emailMatch[0];
  const name = str.replace(email, "").trim();
  if (name) {
    return { name, email };
  }

  return { email };
}

const regex = "[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*";

function emailRegex() {
  return new RegExp(regex, "g");
}
