// Import static
import avatarURL from "../img/avatar-default.png";

window.activeLegendElement = null;

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
  childs.forEach((child) => el.appendChild(child));

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

export function createTooltip(text, description) {
  const spanElement = createDOMElement("span", { text: description });

  return createDOMElement("div", {
    classList: ["tooltip"], text, childs: [spanElement]
  });
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
  return repository.url;
}

export function createAvatarImageElement(email = null) {
  const imageElement = document.createElement("img");
  if (email === null || email === "") {
    imageElement.src = `${avatarURL}`;
  }
  else {
    imageElement.src = `https://unavatar.io/ ${email}`;
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

export function createFileBox(options = {}) {
  const { title, fileName, childs = [], titleHref = "#", fileHref = null, severity = null } = options;

  const defaultHrefProperties = { target: "_blank", rel: "noopener noreferrer" };
  const fileDomElement = fileHref === null ?
    createDOMElement("p", { text: fileName }) :
    createDOMElement("a", { text: fileName, attributes: { href: fileHref, ...defaultHrefProperties } });

  const boxHeader = createDOMElement("div", {
    classList: ["box-header"],
    childs: [
      ...(severity === null ? [] : [
        createDOMElement("span", { classList: [severity], text: severity.charAt(0).toUpperCase() })
      ]),
      createDOMElement("a", {
        text: title,
        attributes: {
          href: titleHref, ...defaultHrefProperties
        }
      }),
      createDOMElement("p", {
        childs: [
          createDOMElement("i", { classList: ["icon-docs"] }),
          fileDomElement
        ]
      })
    ]
  });

  return createDOMElement("div", {
    classList: ["box-file-info"],
    childs: [
      boxHeader,
      ...childs
    ]
  });
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

export function createExpandableSpan(hideItemsLength, onclick = () => void 0) {
  const span = createDOMElement("span", {
    classList: ["expandable"],
    attributes: { "data-value": "closed" },
    childs: [
      createDOMElement("i", { className: "icon-plus-squared-alt" }),
      createDOMElement("p", { text: "show more" })
    ]
  });
  span.addEventListener("click", function itemListClickAction() {
    const isClosed = this.getAttribute("data-value") === "closed";
    {
      const innerI = this.querySelector("i");
      innerI.classList.remove(isClosed ? "icon-plus-squared-alt" : "icon-minus-squared-alt");
      innerI.classList.add(isClosed ? "icon-minus-squared-alt" : "icon-plus-squared-alt");
    }
    this.querySelector("p").textContent = isClosed ? "show less" : "show more";
    this.setAttribute("data-value", isClosed ? "opened" : "closed");

    for (let id = 0; id < this.parentNode.childNodes.length; id++) {
      const node = this.parentNode.childNodes[id];
      if (node !== this) {
        if (isClosed) {
          node.classList.remove("hidden");
        }
        else if (id >= hideItemsLength) {
          node.classList.add("hidden");
        }
      }
    }
    onclick(this);
  });

  return span;
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
  const el = document.createElement('textarea');  // Create a <textarea> element
  el.value = str;                                 // Set its value to the string that you want copied
  el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
  el.style.position = 'absolute';
  el.style.left = '-9999px';                      // Move outside the screen to make it invisible
  document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
  const selected =
    document.getSelection().rangeCount > 0        // Check if there is any content selected previously
      ? document.getSelection().getRangeAt(0)     // Store selection if found
      : false;                                    // Mark as false to know no selection existed before
  el.select();                                    // Select the <textarea> content
  document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
  document.body.removeChild(el);                  // Remove the <textarea> element
  if (selected) {                                 // If a selection existed before copying
    document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
    document.getSelection().addRange(selected);   // Restore the original selection
  }
};
