"use strict";

import { createDOMElement } from "./utils.js";
import semver from "semver";
import sizeSatisfies from "size-satisfies";

// CONSTANTS
const kFiltersName = new Set(["package", "version", "flag", "license", "author", "ext", "builtin", "size"]);
const kHelpersTitleName = {
    ext: "File extensions",
    builtin: "Node.js core modules",
    license: "Available licenses",
    flag: "Available flags"
};
const kHelpersTemplateName = {
    flag: "search_helpers_flags",
    license(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();

        for (const { license } of linker.values()) {
            if (typeof license === "string") {
                items.add("Unknown");
                continue;
            }
            license.uniqueLicenseIds.forEach((ext) => items.add(ext));
        }
        [...items].forEach((value) => fragment.appendChild(createLineElement(value)));

        return fragment;
    },
    ext(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();
        for (const { composition } of linker.values()) {
            composition.extensions.forEach((ext) => items.add(ext));
        }
        items.delete("");
        [...items].forEach((value) => fragment.appendChild(createLineElement(value)));

        return fragment;
    },
    builtin(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();
        for (const { composition } of linker.values()) {
            composition.required_nodejs.forEach((ext) => items.add(ext));
        }
        [...items].forEach((value) => fragment.appendChild(createLineElement(value)));

        return fragment;
    },
    author(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();
        for (const { author } of linker.values()) {
            items.add(typeof author === "string" ? author : author.name);
        }
        [...items].forEach((value) => fragment.appendChild(createLineElement(value)));

        return fragment;
    }
};

function createLineElement(text) {
    const pElement = createDOMElement("p", { text });

    return createDOMElement("div", {
        classList: ["line"],
        childs: [pElement],
        attributes: { "data-value": text }
    });
}

export default class SearchBar {
    constructor(network, linker) {
        this.container = document.querySelector(".search-bar-container");
        this.background = document.querySelector(".search-result-background");
        this.helper = document.querySelector(".search-result-pannel > .helpers");
        this.input = document.getElementById("search-bar-input");
        this.itemsContainer = document.querySelector(".search-bar-container > .search-items");
        this.allSearchPackages = document.querySelectorAll(".search-result-pannel > .package");

        this.network = network;
        this.linker = linker;

        this.delayOpenSearchBar = true;
        this.activeQuery = new Set();
        this.queries = [];
        this.inputUpdateValue = false;
        this.forceNewItem = false;
        let confirmBackspace = false;
        let currentActiveQueryName = null;

        this.container.addEventListener("click", () => {
            if (!this.background.classList.contains("show") && this.delayOpenSearchBar) {
                this.helper.classList.remove("hide");
                this.background.classList.toggle("show");
            }
        });

        this.input.addEventListener("keyup", (event) => {
            if ((this.input.value === null || this.input.value === "")) {
                // we always want to show the default helpers when the input is empty!
                this.showPannelHelper();

                // hide all results if there is no active queries!
                if (this.activeQuery.size === 0) {
                    this.allSearchPackages.forEach((element) => element.classList.add("hide"));
                }

                // if backspace is received and that we have active queries
                // then we want the query to be re-inserted in the input field!
                else if (event.key === "Backspace") {
                    if (confirmBackspace) {
                        this.removeSearchBarItem();
                        currentActiveQueryName = null;
                    }
                    else {
                        confirmBackspace = true;
                    }
                }

                return;
            }
            confirmBackspace = false;

            // if there is no active query filter name, then we want to filter the helper
            if (currentActiveQueryName === null) {
                this.showHelperByInputText();
            }

            // inputUpdateValue is used to force a re-hydratation of the input
            if (event.key === ":" || this.inputUpdateValue) {
                if (this.inputUpdateValue) {
                    setTimeout(() => (this.inputUpdateValue = false), 1);
                }

                // here .split is important because we may have to re-proceed complete search string like 'filter: text'.
                const [keyword] = this.input.value.split(":");
                if (kFiltersName.has(keyword)) {
                    currentActiveQueryName = keyword;
                    this.showPannelHelper(currentActiveQueryName);
                }

                // TODO: we may want to implement a else here to generate an invalid keyword error!
            }

            // In case there is no active package query and the enter key is pressed, then:
            // - we fallback the current query to "package".
            let isPackageSearch = false;
            if (!this.activeQuery.has("package") && currentActiveQueryName === null && event.key === "Enter") {
                if (this.input.value.trim() === "") {
                    return;
                }

                currentActiveQueryName = "package";
                isPackageSearch = true;
                this.showPannelHelper();
            }
            else if (currentActiveQueryName === null) {
                return;
            }

            // fetch the search text
            const text = isPackageSearch ?
                this.input.value.trim() :
                this.input.value.slice(currentActiveQueryName.length + 1).trim();

            this.showHelperByInputText(text);
            if (text.length === 0) {
                return;
            }

            // fetch matching result ids!
            const matchingIds = this.computeText(currentActiveQueryName, text);

            if (event.key === "Enter" || this.forceNewItem) {
                if (this.forceNewItem) {
                    setTimeout(() => (this.forceNewItem = false), 1);
                }

                this.appendCancelButton();
                this.addSearchBarItem(currentActiveQueryName, text, matchingIds);
                this.showPannelHelper();
                currentActiveQueryName = null;
                this.input.value = "";

                if (!isPackageSearch && !this.forceNewItem) {
                    return;
                }
            }
            this.showResultsByIds(matchingIds);
        });

        document.addEventListener("click", (event) => {
            if (!this.container.contains(event.target)
                && this.background.classList.contains("show")
                && !this.inputUpdateValue && !this.forceNewItem) {
                this.close();
            }
        });
        this.showPannelHelper();
    }

    appendCancelButton() {
        if (this.activeQuery.size > 0) {
            return;
        }

        const divElement = createDOMElement("div", { classList: ["cancel"], text: "x" });
        divElement.addEventListener("click", () => {
            this.close();
            setTimeout(() => this.input.focus(), 5);
        });

        this.itemsContainer.appendChild(divElement);
    }

    showPannelHelper(filterName = null) {
        if (filterName !== null && !Reflect.has(kHelpersTemplateName, filterName)) {
            this.helper.classList.add("hide");

            return;
        }

        document.querySelectorAll(".helpers > .line").forEach((element) => element.classList.add("hide"));
        this.helper.classList.remove("hide");
        const templateName = filterName === null ? "search_helpers_default" : kHelpersTemplateName[filterName];

        let clone;
        if (typeof templateName === "function") {
            clone = templateName(this.linker);
        }
        else {
            const templateElement = document.getElementById(templateName);
            clone = templateElement.content.cloneNode(true);
        }

        clone.querySelectorAll(".line").forEach((element) => {
            element.addEventListener("click", () => {
                if (filterName === null) {
                    this.inputUpdateValue = true;
                    this.input.value = element.getAttribute("data-value");
                }
                else {
                    this.forceNewItem = true;
                    this.input.value += element.getAttribute("data-value");
                    this.helper.classList.add("hide");
                }

                this.input.focus();
                this.input.dispatchEvent(new Event("keyup"));
            });
        });

        const titleText = Reflect.has(kHelpersTitleName, filterName) ? kHelpersTitleName[filterName] : "Options de recherche";
        // eslint-disable-next-line max-len
        this.helper.innerHTML = `<div class="title"><p>${titleText}</p><a href="https://github.com/ES-Community/nsecure" rel="noopener" target="_blank"><i class="icon-attention-circled"></i></a></div>`;
        this.helper.appendChild(clone);
    }

    removeSearchBarItem() {
        const [fullQuery, divElement] = this.queries.pop();
        const [filterName] = fullQuery.split(":");
        this.activeQuery.delete(filterName);
        this.itemsContainer.removeChild(divElement);
        if (this.activeQuery.size === 0) {
            while (this.itemsContainer.firstChild) {
                this.itemsContainer.removeChild(this.itemsContainer.lastChild);
            }
        }

        this.input.value = fullQuery;
        this.inputUpdateValue = true;
        this.input.focus();
        this.input.dispatchEvent(new Event("keyup"));
    }

    addSearchBarItem(filterName, text, ids) {
        const bElement = createDOMElement("b", { text: `${filterName}:` });
        const pElement = createDOMElement("p", { text });

        const element = this.itemsContainer.children[this.itemsContainer.children.length - 1];
        const divElement = createDOMElement("div", { childs: [bElement, pElement] });
        this.itemsContainer.insertBefore(divElement, element);

        this.activeQuery.add(filterName);
        this.queries.push([`${filterName}:${text}`, divElement, [...ids]]);
    }

    computeText(filterName, inputValue) {
        const matchingIds = new Set();
        const storedIds = new Set();
        for (const [,, ids] of this.queries) {
            ids.forEach((id) => storedIds.add(id));
        }

        for (const [id, opt] of this.linker) {
            switch (filterName) {
                case "version": {
                    if (semver.satisfies(opt.version, inputValue)) {
                        matchingIds.add(String(id));
                    }
                    break;
                }
                case "package": {
                    if (new RegExp(inputValue, "gi").test(opt.name)) {
                        matchingIds.add(String(id));
                    }
                    break;
                }
                case "license": {
                    const licences = typeof opt.license === "string" ? ["Unknown"] : [...new Set(opt.license.uniqueLicenseIds)];
                    const hasMatchingLicense = licences.some((value) => new RegExp(inputValue, "gi").test(value));
                    if (hasMatchingLicense) {
                        matchingIds.add(String(id));
                    }

                    break;
                }
                case "ext": {
                    const extensions = new Set(opt.composition.extensions);
                    const wantedExtension = inputValue.startsWith(".") ? inputValue : `.${inputValue}`;
                    if (extensions.has(wantedExtension.toLowerCase())) {
                        matchingIds.add(String(id));
                    }

                    break;
                }
                case "size": {
                    if (sizeSatisfies(inputValue, opt.size)) {
                        matchingIds.add(String(id));
                    }

                    break;
                }
                case "builtin": {
                    const hasMatchingBuiltin = opt.composition.required_nodejs
                        .some((value) => new RegExp(inputValue, "gi").test(value));
                    if (hasMatchingBuiltin) {
                        matchingIds.add(String(id));
                    }

                    break;
                }
                case "author": {
                    const authorRegex = new RegExp(inputValue, "gi");

                    if ((typeof opt.author === "string" && authorRegex.test(opt.author)) ||
                        (opt.author.name && authorRegex.test(opt.author.name))) {
                        matchingIds.add(String(id));
                    }
                    break;
                }
                case "flag":
                    if (opt.flags.includes(inputValue)) {
                        matchingIds.add(String(id));
                    }
                    break;
            }
        }

        return storedIds.size === 0 ? matchingIds : new Set([...matchingIds].filter((value) => storedIds.has(value)));
    }

    resultRowClick(dataValue) {
        this.delayOpenSearchBar = false;
        this.network.emit("click", { nodes: [dataValue] });
        this.close();

        setTimeout(() => {
            this.delayOpenSearchBar = true;
        }, 5);
    }

    showResultsByIds(ids = new Set()) {
        for (const pkgElement of this.allSearchPackages) {
            const isMatching = ids.has(pkgElement.getAttribute("data-value"));
            pkgElement.classList[isMatching ? "remove" : "add"]("hide");
        }
    }

    showHelperByInputText(text = this.input.value.trim()) {
        const elements = document.querySelectorAll(".helpers > .line");

        for (const pkgElement of elements) {
            const dataValue = pkgElement.getAttribute("data-value");
            pkgElement.classList[dataValue.match(text) ? "remove" : "add"]("hide");
        }
    }

    close() {
        this.background.classList.remove("show");
        this.allSearchPackages.forEach((element) => element.classList.add("hide"));

        this.itemsContainer.innerHTML = "";
        this.activeQuery = new Set();
        this.queries = [];
        this.input.value = "";
        this.input.blur();
        this.helper.classList.remove("hide");
        this.showPannelHelper();
    }
}
