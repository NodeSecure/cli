export interface CreateDOMElementOptions {
  classList?: string[];
  childs?: Node[];
  attributes?: Record<string, any>;
  text?: string | null;
  className?: string | null;
}

export function createDOMElement(
  kind: keyof HTMLElementTagNameMap = "div",
  options: CreateDOMElementOptions = {}
): HTMLElement {
  const {
    classList = [],
    childs = [],
    attributes = {},
    text = null,
    className = null
  } = options;

  const el = document.createElement(kind);
  if (className !== null) {
    el.className = className;
  }
  classList.forEach((name) => el.classList.add(name));
  childs.forEach((child) => el.appendChild(child));

  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, value);
  }

  if (text !== null) {
    el.appendChild(document.createTextNode(String(text)));
  }

  return el;
}
