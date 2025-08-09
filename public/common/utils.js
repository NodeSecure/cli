// Import Internal Dependencies
import avatarURL from "../img/avatar-default.png";
import "../components/expandable/expandable.js";

window.activeLegendElement = null;

export function vec2Distance(location, pos) {
  return Math.sqrt(
    Math.pow(location.x - pos.x, 2) + Math.pow(location.y - pos.y, 2)
  );
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
 * @param {Record<string, any>} [options.styles]
 * @param {string | null} [options.text]
 * @param {string | null} [options.className]
 * @returns {HTMLElement}
 */
export function createDOMElement(kind = "div", options = {}) {
  const {
    classList = [],
    childs = [],
    attributes = {},
    styles = {},
    text = null,
    className = null
  } = options;

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
  if (Object.keys(styles).length > 0) {
    Object.assign(el.style, styles);
  }

  return el;
}

export function createLink(href, text = null) {
  const attributes = {
    rel: "noopener", target: "_blank", href
  };

  return createDOMElement("a", { text, attributes });
}

export function parseNpmSpec(spec) {
  const parts = spec.split("@");
  const [version, local] = parts[parts.length - 1].split("#");

  return spec.startsWith("@") ?
    { name: `@${parts[1]}`, version, local: Boolean(local) } :
    { name: parts[0], version, local: Boolean(local) };
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

function createImageElement(baseUrl, id = null) {
  const imageElement = document.createElement("img");
  if (id === null || id === "") {
    imageElement.src = `${avatarURL}`;
  }
  else {
    imageElement.src = `${baseUrl}/${id}`;
    imageElement.onerror = () => {
      imageElement.src = `${avatarURL}`;
    };
  }

  return imageElement;
}

export function createAvatarImageElementForAuthor(author = {}) {
  return author.npmAvatar
    ? createImageElement("https://www.npmjs.com", author.npmAvatar)
    : createImageElement("https://unavatar.io", author.email);
}

export function createAvatar(name, desc) {
  const pElement = createDOMElement("p", {
    classList: ["count"], text: desc.count
  });
  const aElement = createLink(desc.url || "#");
  const divEl = createDOMElement("div", {
    classList: ["avatar"], childs: [pElement, aElement]
  });

  const imgEl = createAvatarImageElementForAuthor({ email: desc.email });
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
    const expandableSpan = document.createElement("expandable-span");
    expandableSpan.onToggle = (expandable) => toggle(expandable, node, hideItemsLength);
    fragment.appendChild(expandableSpan);
  }
  node.appendChild(fragment);
}

/*
TODO: this util function won't be necessary once the parents of the expandable component will be migrated to lit
becuase the parents will handle the filtering of their children themselves
*/
export function toggle(expandable, parentNode, hideItemsLength) {
  expandable.isClosed = !expandable.isClosed;
  for (let id = 0; id < parentNode.childNodes.length; id++) {
    const node = parentNode.childNodes[id];
    if (node.tagName === "EXPANDABLE-SPAN") {
      continue;
    }

    if (!expandable.isClosed) {
      node.classList.remove("hidden");
    }
    else if (id >= hideItemsLength) {
      node.classList.add("hidden");
    }
  }
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

export function hideOnClickOutside(
  element,
  options = {}
) {
  const {
    reverse = false,
    blacklist = [],
    hiddenTarget = element,
    callback = () => void 0
  } = options;

  function outsideClickListener(event) {
    if (!element.contains(event.target) && !blacklist.includes(event.target)) {
      if (hiddenTarget) {
        if (reverse) {
          hiddenTarget.classList.remove("show");
        }
        else {
          hiddenTarget.classList.add("hidden");
        }
      }
      callback();
      removeClickListener();
    }
  }

  function removeClickListener() {
    document.removeEventListener("click", outsideClickListener);
  }

  document.addEventListener("click", outsideClickListener);

  return outsideClickListener;
}

export function currentLang() {
  const detectedLang = document.getElementById("lang").dataset.lang;

  return detectedLang in window.i18n ? detectedLang : "english";
}

export function debounce(callback, delay) {
  let timer;

  // eslint-disable-next-line func-names
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}
