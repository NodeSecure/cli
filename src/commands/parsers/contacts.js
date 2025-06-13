// CONSTANTS
const kEmailRegex = "[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*";

export function parseContacts(input) {
  return Array.isArray(input) ? input.map(parseContact) : [parseContact(input)];
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

function emailRegex() {
  return new RegExp(kEmailRegex, "g");
}
