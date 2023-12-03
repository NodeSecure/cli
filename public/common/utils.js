/* eslint-disable no-invalid-this */
// Import static
import avatarURL from "../img/avatar-default.png";

// Import Internal Dependencies
import { createExpandableSpan } from "../components/expandable/expandable";

window.activeLegendElement = null;

function getVCSRepositoryPath(url) {
  if (!url) {
    return null;
  }

  try {
    const repo = new URL(url);

    return repo.pathname.slice(
      1,
      repo.pathname.includes(".git") ? -4 : repo.pathname.length
    );
  }
  catch {
    return null;
  }
}

function getVCSRepositoryPlatform(url) {
  if (!url) {
    return null;
  }

  try {
    const repo = new URL(url);

    return repo.host;
  }
  catch {
    return null;
  }
}

export function getRepositoryName(repository) {
  return getVCSRepositoryPath(repository.links?.github?.href) ??
    getVCSRepositoryPath(repository.links?.gitlab?.href) ??
    getVCSRepositoryPath(repository.links?.homepage?.href) ??
    getVCSRepositoryPath(repository.metadata?.homepage) ??
    repository.name;
}

export function getRepositoryPlatform(repository) {
  return getVCSRepositoryPlatform(repository.links?.github?.href) ??
    getVCSRepositoryPlatform(repository.links?.gitlab?.href) ??
    getVCSRepositoryPlatform(repository.links?.homepage) ??
    getVCSRepositoryPlatform(repository.metadata?.homepage) ??
    "github.com";
}

export function isGitLabHost(host) {
  if (!host) {
    return false;
  }

  try {
    return new URL(host).host === "gitlab.com";
  }
  catch {
    return false;
  }
}

export function extractEmojis(strWithEmojis) {
  const segmenter = new Intl.Segmenter("en", {
    granularity: "grapheme"
  });
  const segitr = segmenter.segment(strWithEmojis.replaceAll(" ", ""));

  return Array.from(segitr, ({ segment }) => segment);
}

/**
 * @param {keyof HTMLElementTagNameMap} kind
 * @param {object} [options]
 * @param {string[]} [options.classList]
 * @param {HTMLElement[]} [options.childs]
 * @param {Record<string, any>} [options.attributes]
 * @param {string | null} [options.text]
 * @param {string | null} [options.className]
 * @returns {HTMLElement}
 */
export function createDOMElement(kind = "div", options = {}) {
  const { classList = [], childs = [], attributes = {}, text = null, className = null } = options;

  const el = document.createElement(kind);
  if (className !== null) {
    el.className = className;
  }
  classList.forEach((name) => el.classList.add(name));
  childs
    .filter((child) => child !== null)
    .forEach((child) => el.appendChild(child));

  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, value);
  }

  if (text !== null) {
    el.appendChild(document.createTextNode(String(text)));
  }

  return el;
}

export function createLink(href, text = null) {
  const attributes = {
    rel: "noopener", target: "_blank", href
  };

  return createDOMElement("a", { text, attributes });
}

export function parseRepositoryUrl(repository = {}, defaultValue = null) {
  if (typeof repository !== "object" || !("url" in repository)) {
    return defaultValue;
  }

  if (repository.url.startsWith("git+")) {
    return repository.url.slice(4);
  }
  if (repository.url.startsWith("git://")) {
    return `https${repository.url.slice(3)}`;
  }
  if (repository.url.startsWith("git@")) {
    const execResult = /git@(?<platform>[a-zA-Z.]+):(?<repo>.+)\.git/gm.exec(repository.url);
    if (execResult === null) {
      return defaultValue;
    }

    return `https://${execResult.groups.platform}/${execResult.groups.repo}`;
  }

  try {
    return new URL(repository.url).href;
  }
  catch {
    return defaultValue;
  }
}

export function createAvatarImageElement(email = null) {
  const imageElement = document.createElement("img");
  if (email === null || email === "") {
    imageElement.src = `${avatarURL}`;
  }
  else {
    imageElement.src = `https://unavatar.io/${email}`;
    imageElement.onerror = () => {
      imageElement.src = `${avatarURL}`;
    };
  }

  return imageElement;
}

export function createAvatar(name, desc) {
  const pElement = createDOMElement("p", {
    classList: ["count"], text: desc.count
  });
  const aElement = createLink(desc.url || "#");
  const divEl = createDOMElement("div", {
    classList: ["avatar"], childs: [pElement, aElement]
  });

  const imgEl = createAvatarImageElement(desc.email);
  imgEl.alt = name;
  aElement.appendChild(imgEl);

  return divEl;
}

export function createLiField(title, value, options = {}) {
  const { isLink = false } = options;

  const bElement = createDOMElement("b", { text: title });
  const liElement = createDOMElement("li", { childs: [bElement] });
  let elementToAppend;

  if (isLink) {
    const textValue = value.length > 26 ? `${value.slice(0, 26)}...` : value;
    elementToAppend = createLink(value, textValue);
  }
  else {
    elementToAppend = createDOMElement("p", { text: value });
  }
  liElement.appendChild(elementToAppend);

  return liElement;
}

export function createItemsList(node, items = [], options = {}) {
  const { onclick = null, hideItems = false, hideItemsLength = 5 } = options;

  if (items.length === 0) {
    const previousNode = node.previousElementSibling;
    if (previousNode !== null) {
      previousNode.style.display = "none";
    }

    return;
  }

  const fragment = document.createDocumentFragment();
  for (let id = 0; id < items.length; id++) {
    const elem = items[id];
    if (elem.trim() === "") {
      continue;
    }

    const span = createDOMElement("span", { text: elem });
    if (hideItems && id >= hideItemsLength) {
      span.classList.add("hidden");
    }
    if (onclick !== null && typeof onclick === "function") {
      span.classList.add("clickable");
      span.addEventListener("click", (event) => onclick(event, elem));
    }
    fragment.appendChild(span);
  }

  if (hideItems && items.length > hideItemsLength) {
    fragment.appendChild(createExpandableSpan(hideItemsLength));
  }
  node.appendChild(fragment);
}

export function copyToClipboard(str) {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}

export function hideOnClickOutside(element, blacklistElements = []) {
  const outsideClickListener = (event) => {
    if (!element.contains(event.target) && !blacklistElements.includes(event.target)) {
      element.classList.add("hidden");
      removeClickListener();
    }
  };

  const removeClickListener = () => {
    document.removeEventListener("click", outsideClickListener);
  };

  document.addEventListener("click", outsideClickListener);
}