// Import Third-party Dependencies
import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";

// Import Internal Dependencies
import * as CONSTANTS from "./constants.js";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);

// CONSTANTS
const kRawGithubFlagsURL = "https://raw.githubusercontent.com/NodeSecure/scanner/refs/heads/master/workspaces/flags/src/flags";
const kRawGithubWarningsURL = "https://raw.githubusercontent.com/NodeSecure/js-x-ray/master/docs";
const kMarkdownConvertor = new MarkdownIt({
  html: true
});

/** @type {Map<string, string>} */
export const cache = new Map();

/**
 * Fetch NodeSecure flags on Github
 *
 * @param {!string} title flag title
 * @param {object} [options]
 * @param {boolean} [options.cacheReponse=true] Set the HTML Response in cache and memoize the response for next call.
 * @returns {Promise<string>}
 */
export async function fetchNodeSecureFlagByTitle(title, options = {}) {
  const { cacheReponse = true } = options;

  const cacheTitle = `flags-${title}`;
  if (cacheReponse && cache.has(cacheTitle)) {
    return cache.get(cacheTitle);
  }

  const httpResponse = await fetch(`${kRawGithubFlagsURL}/${title}.html`);
  const htmlResponse = await httpResponse.text();
  if (cacheReponse) {
    cache.set(cacheTitle, htmlResponse);
  }

  return htmlResponse;
}

/**
 * Fetch NodeSecure warnings on Github
 *
 * @param {!string} title flag title
 * @param {object} [options]
 * @param {boolean} [options.cacheReponse=true] Set the HTML Response in cache and memoize the response for next call.
 * @returns {Promise<string>}
 */
export async function fetchNodeSecureWarningsByTitle(title, options = {}) {
  const { cacheReponse = true } = options;

  const cacheTitle = `warnings-${title}`;
  if (cacheReponse && cache.has(cacheTitle)) {
    return cache.get(cacheTitle);
  }

  const httpResponse = await fetch(`${kRawGithubWarningsURL}/${title}.md`);
  const markdownResponse = await httpResponse.text();
  const htmlResponse = kMarkdownConvertor.render(
    markdownResponse
      .replaceAll("[!IMPORTANT]", "🚨")
      .replaceAll("[!NOTE]", "📝")
      .replaceAll("[!CAUTION]", "🔶")
      .replaceAll("[!WARNING]", "⚠️")
      .replaceAll("[!TIP]", "💡")
  );

  if (cacheReponse) {
    cache.set(cacheTitle, htmlResponse);
  }

  return htmlResponse;
}

/**
 *
 * @param {!HTMLElement} menuElement
 * @param {"flags" | "warnings"} kind
 * @returns {void}
 */
export async function fetchAndRenderByMenu(menuElement, kind = "flags") {
  const fn = kind === "flags" ? fetchNodeSecureFlagByTitle : fetchNodeSecureWarningsByTitle;
  const htmlResponse = await fn(
    menuElement.getAttribute("data-title")
  );

  const documentContentElement = document.querySelector(`.documentation--${kind} .${CONSTANTS.DIV_CONTENT}`);
  documentContentElement.innerHTML = kind === "flags" ? htmlResponse : `<div>${htmlResponse}</div>`;
  documentContentElement.querySelectorAll("a").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
  });
  hljs.highlightAll();
}
