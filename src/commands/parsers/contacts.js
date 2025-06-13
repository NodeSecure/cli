// CONSTANTS
const kEmailRegex = "[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*";

export function parseContacts(arr) {
  return arr.map(parseContact);
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
