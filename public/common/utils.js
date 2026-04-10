// Import Internal Dependencies
import "../components/expandable/expandable.js";

window.activeLegendElement = null;

/**
 * @param {{x: number, y: number}} location
 * @param {{x: number, y: number}} pos
 * @returns {number}
 */
export function vec2Distance(location, pos) {
  return Math.sqrt(
    Math.pow(location.x - pos.x, 2) + Math.pow(location.y - pos.y, 2)
  );
}

/**
 * @param {string} strWithEmojis
 * @returns {string[]}
 */
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

/**
 * @param {string} href
 * @param {string|null} text
 * @returns {HTMLElement}
 */
export function createLink(href, text = null) {
  const attributes = {
    rel: "noopener", target: "_blank", href
  };

  return createDOMElement("a", { text, attributes });
}

/**
 * @param {string} spec
 * @returns {{ name: string, version: string }}
 */
export function parseNpmSpec(spec) {
  const parts = spec.split("@");
  const version = parts.at(-1);

  return spec.startsWith("@") ?
    { name: `@${parts[1]}`, version } :
    { name: parts[0], version };
}

/**
 * @param {{url?: string}} repository
 * @param {string | null} defaultValue
 * @returns {string | null} return repository url or defaultValue
 */
export function parseRepositoryUrl(repository = {}, defaultValue = null) {
  if (!repository || !repository.url || typeof repository !== "object" || !("url" in repository)) {
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
    if (execResult === null || !execResult.groups) {
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

/**
 * @param {string} title
 * @param {string} value
 * @param {Record<string, any>} options
 * @returns {HTMLElement}
 */
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

/**
 * @param {HTMLElement} node - The parent DOM element.
 * @param {string[]} items - Array of strings to display.
 * @param {Object} [options] - Optional configuration options.
 * @param {Function} [options.onclick] - Callback function (event, item).
 * @param {boolean} [options.hideItems] - Hide items if needed.
 * @param {number} [options.hideItemsLength] - Number of visible elements before masking.
 * @returns {void}
 */
export function createItemsList(node, items = [], options = {}) {
  const { onclick = null, hideItems = false, hideItemsLength = 5 } = options;
  if (items.length === 0) {
    const previousNode = node.previousElementSibling;
    if (previousNode !== null && previousNode instanceof HTMLElement) {
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
    /** @type {import("../components/expandable/expandable.js").ExpandableType} */
    // @ts-expect-error createElement return HTMLElement and we can't cast directly from line (Unexpected comment inline with code.)
    const expandableSpan = document.createElement("expandable-span");
    expandableSpan.onToggle = () => toggle(expandableSpan, node, hideItemsLength);
    fragment.appendChild(expandableSpan);
  }
  node.appendChild(fragment);
}

/*
TODO: this util function won't be necessary once the parents of the expandable component will be migrated to lit
becuase the parents will handle the filtering of their children themselves
*/
/**
 * @param {import("../components/expandable/expandable.js").ExpandableType} expandable
 * @param {HTMLElement} parentNode
 * @param {number} hideItemsLength
 * @returns {void}
 */
export function toggle(expandable, parentNode, hideItemsLength) {
  expandable.isClosed = !expandable.isClosed;
  for (let id = 0; id < parentNode.children.length; id++) {
    const node = parentNode.children[id];
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

/**
 * @param {string} str
 * @returns {void}
 */
export function copyToClipboard(str) {
  const el = document.createElement("textarea");
  el.value = str;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  const selection = document.getSelection();
  const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  if (selected && selection) {
    selection.removeAllRanges();
    selection.addRange(selected);
  }
}

/**
 * @typedef {{reverse?: boolean, blacklist?: Node[], hiddenTarget?: HTMLElement, callback?: () => void}} hideOnClickOutsideOptions
 */

/**
 * @param {HTMLElement} element
 * @param {hideOnClickOutsideOptions} options
 * @returns {(event: Event) => void}
 */
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

  /** @param {Event} event */
  function outsideClickListener(event) {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!element.contains(target) && !blacklist.includes(target)) {
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

/** @returns {string} */
export function currentLang() {
  const detectedLang = document.getElementById("lang")?.dataset.lang;
  const defaultLanguage = "english";
  if (!detectedLang) {
    return defaultLanguage;
  }

  return detectedLang in window.i18n ? detectedLang : defaultLanguage;
}

/**
 * @param {Function} callback
 * @param {number} delay
 * @returns {() => void}
 */
export function debounce(callback, delay) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  // eslint-disable-next-line func-names
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}
