"use strict";

// CONSTANTS
const kFiltersName = new Set(["package", "version", "flag", "license", "author", "ext", "builtin"]);
const kHelpersTemplateName = {
    license: "search_helpers_license"
};

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

            if (event.key === ":") {
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
                this.helper.classList.add("hide");
            }
            else if (currentInSearchKeyword === null) {
                return;
            }

            const text = exceptionalMatch ?
                this.input.value.trim() :
                this.input.value.slice(currentInSearchKeyword.length + 1).trim();
            const matchingIds = this.computeText(currentInSearchKeyword, text);
            if (matchingIds === null) {
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                this.input.value = "";
                this.addItem(currentInSearchKeyword, text, matchingIds);
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
        const templateName = filterName === null ? "search_helpers_default" : kHelpersTemplateName[filterName];

        const templateElement = document.getElementById(templateName);
        const clone = templateElement.content.cloneNode(true);
        clone.querySelectorAll(".line").forEach((element) => {
            element.addEventListener("click", () => {
                this.input.focus();
                if (filterName === null) {
                    this.input.value = element.getAttribute("data-value");

                    return;
                }
                this.input.value += element.getAttribute("data-value");

                const ev = new KeyboardEvent("keyup", {
                    altKey: false,
                    bubbles: true,
                    cancelBubble: false,
                    cancelable: true,
                    charCode: 0,
                    code: "Enter",
                    composed: true,
                    ctrlKey: false,
                    currentTarget: null,
                    defaultPrevented: true,
                    detail: 0,
                    eventPhase: 0,
                    isComposing: false,
                    isTrusted: true,
                    key: "Enter",
                    keyCode: 13,
                    location: 0,
                    metaKey: false,
                    repeat: false,
                    returnValue: false,
                    shiftKey: false,
                    type: "keyup",
                    which: 13
                });
                this.input.dispatchEvent(ev);
            });
        });

        this.helper.innerHTML = "";
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
        if (inputValue.length === 0) {
            return null;
        }

        // const storedIds = new Set();
        // for (const { ids } of this.activeKeywords.values()) {
        //     ids.forEach((id) => storedIds.add(id));
        // }

        const inputRegex = new RegExp(`^${inputValue}`, "gi");
        for (const [id, opt] of this.linker) {
            let isMatching = false;
            switch (filterName) {
                case "version":
                case "package":
                    if (inputRegex.test(filterName === "package" ? opt.name : opt.version)) {
                        isMatching = true;
                    }
                    break;
                case "license": {
                    const licences = typeof opt.license === "string" ? ["Unknown"] : [...new Set(opt.license.uniqueLicenseIds)];
                    const hasMatchingLicense = licences.some((value) => new RegExp(inputValue, "gi").test(value));
                    if (hasMatchingLicense) {
                        isMatching = true;
                    }

                    break;
                }
                case "ext": {
                    const extensions = new Set(opt.composition.extensions);
                    const wantedExtension = inputValue.startsWith(".") ? inputValue : `.${inputValue}`;
                    if (extensions.has(wantedExtension.toLowerCase())) {
                        isMatching = true;
                    }

                    break;
                }
                case "builtin": {
                    const builtin = new Set(opt.composition.required_builtin);
                    if (builtin.has(inputValue.toLowerCase())) {
                        isMatching = true;
                    }

                    break;
                }
                case "author": {
                    const author = inputValue.toLowerCase();
                    if (typeof opt.author === "string" && opt.author.toLowerCase().match(author)) {
                        isMatching = true;
                    }
                    else if (opt.author.name && opt.author.name.toLowerCase().match(author)) {
                        isMatching = true;
                    }
                    break;
                }
                case "flag":
                    if (inputValue in opt.flags && opt.flags[inputValue] === true) {
                        isMatching = true;
                    }
                    break;
            }

            if (isMatching) {
                matchingIds.add(String(id));
            }
        }

        return matchingIds;
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
        this.helper.classList.remove("hide");
    }

    toggle(ids = new Set()) {
        for (const pkgElement of this.allSearchPackages) {
            const isMatching = ids.has(pkgElement.getAttribute("data-value"));
            pkgElement.classList[isMatching ? "remove" : "add"]("hide");
        }
    }

    close() {
        this.background.classList.remove("show");
        this.allSearchPackages.forEach((element) => element.classList.add("hide"));

        this.itemsContainer.innerHTML = "";
        this.activeKeywords = new Map();
        this.input.value = "";
        this.input.blur();
        this.helper.classList.remove("hide");
    }
}
