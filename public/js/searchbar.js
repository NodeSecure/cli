"use strict";

// CONSTANTS
const FILTERS_NAME = new Set(["package", "version", "flag", "license", "author", "ext", "builtin"]);

class SearchBar {
    constructor(network, linker) {
        this.container = document.querySelector(".search-bar-container");
        this.background = document.querySelector(".search-result-background");
        this.helper = document.querySelector(".search-result-container > .helpers");
        this.input = document.getElementById("search-bar-input");
        this.allSearchPackages = document.querySelectorAll(".search-result-container > .package");
        this.delayOpenSearchBar = true;
        this.network = network;

        this.container.addEventListener("click", () => {
            if (!this.background.classList.contains("show") && this.delayOpenSearchBar) {
                this.helper.style.display = "flex";
                this.background.classList.toggle("show");
            }
        });

        this.input.addEventListener("input", () => {
            if (this.input.value === null || this.input.value === "") {
                this.reset();

                return;
            }

            let filterName = "package";
            let inputValue = this.input.value;
            if (this.input.value.startsWith(":")) {
                const [filter, ...other] = this.input.value.split(" ");
                if (!FILTERS_NAME.has(filter.slice(1))) {
                    return;
                }

                filterName = filter.slice(1);
                inputValue = other.join(" ");
            }
            this.helper.style.display = "none";

            const matchingIds = new Set();
            const inputRegex = new RegExp(`^${inputValue}`, "gi");
            for (const [id, opt] of linker) {
                let isMatching = false;
                switch (filterName) {
                    case "version":
                    case "package":
                        if (inputRegex.test(filterName === "package" ? opt.name : opt.version)) {
                            isMatching = true;
                        }
                        break;
                    case "license": {
                        if (typeof opt.license === "string") {
                            if (inputValue === "Unknown") {
                                isMatching = true;
                            }
                            break;
                        }

                        const uniqueLicenseIds = new Set(opt.license.uniqueLicenseIds.map((value) => value.toLowerCase()));
                        if (uniqueLicenseIds.has(inputValue.toLowerCase())) {
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

            this.toggle(matchingIds);
        });

        document.addEventListener("click", (event) => {
            if (!this.container.contains(event.target) && this.background.classList.contains("show")) {
                this.close();
            }
        });
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
        this.helper.style.display = "flex";
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

        this.input.value = "";
        this.input.blur();
        this.helper.style.display = "flex";
    }
}
