"use strict";

// CONSTANTS
const kFiltersName = new Set(["package", "version", "flag", "license", "author", "ext", "builtin"]);
const kHelpersTemplateName = {
    flag: "search_helpers_flags",
    license(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();

        for (const { license } of linker.values()) {
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
        [...items].forEach((value) => fragment.appendChild(createLineElement(value)));

        return fragment;
    },
    builtin(linker) {
        const fragment = document.createDocumentFragment();
        const items = new Set();
        for (const { composition } of linker.values()) {
            composition.required_builtin.forEach((ext) => items.add(ext));
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
    const div = document.createElement("div");
    div.classList.add("line");
    div.setAttribute("data-value", text);

    const pElement = document.createElement("p");
    pElement.appendChild(document.createTextNode(text));
    div.appendChild(pElement);

    return div;
}

class SearchBar {
    constructor(network, linker) {
        this.container = document.querySelector(".search-bar-container");
        this.background = document.querySelector(".search-result-background");
        this.helper = document.querySelector(".search-result-pannel > .helpers");
        this.input = document.getElementById("search-bar-input");
        this.itemsContainer = document.querySelector(".search-bar-container > .search-items");
        this.allSearchPackages = document.querySelectorAll(".search-result-pannel > .package");

        this.delayOpenSearchBar = true;
        this.network = network;
        this.activeKeywords = new Map();
        this.linker = linker;
        this.inputUpdateValue = false;
        let currentInSearchKeyword = null;

        this.container.addEventListener("click", () => {
            if (!this.background.classList.contains("show") && this.delayOpenSearchBar) {
                this.helper.classList.remove("hide");
                this.background.classList.toggle("show");
            }
        });

        this.input.addEventListener("keyup", (event) => {
            if ((this.input.value === null || this.input.value === "") && this.activeKeywords.size === 0) {
                this.reset();

                return;
            }

            if (event.key === ":" || this.inputUpdateValue) {
                this.inputUpdateValue = false;
                const keyword = this.input.value.slice(0, -1);
                if (kFiltersName.has(keyword)) {
                    currentInSearchKeyword = keyword;
                    this.toggleHelpers(currentInSearchKeyword);
                }
                else {
                    event.preventDefault();
                }
            }

            let exceptionalMatch = false;
            if (!this.activeKeywords.has("package") && currentInSearchKeyword === null && event.key === "Enter") {
                if (this.input.value.trim() === "") {
                    return;
                }

                currentInSearchKeyword = "package";
                exceptionalMatch = true;
                this.toggleHelpers();
            }
            else if (currentInSearchKeyword === null) {
                return;
            }

            const text = exceptionalMatch ?
                this.input.value.trim() :
                this.input.value.slice(currentInSearchKeyword.length + 1).trim();
            if (text.length === 0) {
                return;
            }
            const matchingIds = this.computeText(currentInSearchKeyword, text);

            if (event.key === "Enter") {
                event.preventDefault();
                this.input.value = "";

                const activeKeywordsSize = this.activeKeywords.size;
                this.addItem(currentInSearchKeyword, text, matchingIds);
                if (activeKeywordsSize === 0) {
                    const div = document.createElement("div");
                    div.addEventListener("click", () => {
                        this.close(false);
                        setTimeout(() => {
                            this.input.focus();
                        }, 5);
                    });
                    div.classList.add("cancel");
                    div.textContent = "x";

                    this.itemsContainer.appendChild(div);
                }
                this.toggleHelpers();
                currentInSearchKeyword = null;

                if (!exceptionalMatch) {
                    return;
                }
            }
            this.toggle(matchingIds);
        });

        document.addEventListener("click", (event) => {
            if (!this.container.contains(event.target) && this.background.classList.contains("show")) {
                this.close();
            }
        });
        this.toggleHelpers();
    }

    toggleHelpers(filterName = null) {
        if (filterName !== null && !Reflect.has(kHelpersTemplateName, filterName)) {
            this.helper.classList.add("hide");

            return;
        }
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
                    this.input.value += element.getAttribute("data-value");
                    this.helper.classList.add("hide");
                }

                this.input.focus();
                this.input.dispatchEvent(new Event("keyup"));
            });
        });

        this.helper.innerHTML = "<div class=\"title\"><p>Options de recherche</p></div>";
        this.helper.appendChild(clone);
    }

    addItem(filterName, value, ids) {
        const div = document.createElement("div");
        const bElement = document.createElement("b");
        bElement.appendChild(document.createTextNode(`${filterName}:`));
        const pElement = document.createElement("p");
        pElement.appendChild(document.createTextNode(value));

        div.appendChild(bElement);
        div.appendChild(pElement);

        this.activeKeywords.set(filterName, {
            textValue: value,
            htmlElement: div,
            ids: [...ids]
        });
        this.itemsContainer.appendChild(div);
    }

    computeText(filterName, inputValue) {
        const matchingIds = new Set();
        const storedIds = new Set();
        for (const { ids } of this.activeKeywords.values()) {
            ids.forEach((id) => storedIds.add(id));
        }

        for (const [id, opt] of this.linker) {
            switch (filterName) {
                case "version":
                case "package": {
                    const inputRegex = new RegExp(`^${inputValue}`, "gi");
                    if (inputRegex.test(filterName === "package" ? opt.name : opt.version)) {
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
                case "builtin": {
                    const hasMatchingBuiltin = opt.composition.required_builtin
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
                    if (inputValue in opt.flags && opt.flags[inputValue] === true) {
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

    reset() {
        this.allSearchPackages.forEach((element) => element.classList.add("hide"));
        this.toggleHelpers();
    }

    toggle(ids = new Set()) {
        for (const pkgElement of this.allSearchPackages) {
            const isMatching = ids.has(pkgElement.getAttribute("data-value"));
            pkgElement.classList[isMatching ? "remove" : "add"]("hide");
        }
    }

    close(blur = true) {
        this.background.classList.remove("show");
        this.allSearchPackages.forEach((element) => element.classList.add("hide"));

        this.itemsContainer.innerHTML = "";
        this.activeKeywords = new Map();
        this.input.value = "";
        if (blur) {
            this.input.blur();
        }
        this.helper.classList.remove("hide");
    }
}
