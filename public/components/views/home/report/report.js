// Import Internal Dependencies
import { PopupTemplate } from "../../../popup/popup.js";

export class PopupReport {
  constructor(rootDependencyName) {
    this.rootDependencyName = rootDependencyName;
  }

  render() {
    const templateElement = document.getElementById("report-popup-template");
    /** @type {HTMLElement} */
    const clone = templateElement.content.cloneNode(true);
    const form = clone.querySelector("form");
    clone.querySelector("#title").placeholder = `${this.rootDependencyName}'s report`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      form.querySelector(".spinner").classList.remove("hidden");
      const title = form.querySelector("#title").value;
      const theme = form.querySelector("#lightTheme").checked ? "light" : "dark";
      const includesAllDeps = form.querySelector("#includesAllDeps").checked;

      fetch("/report", {
        method: "POST",
        body: JSON.stringify({
          title,
          includesAllDeps,
          theme
        }),
        headers: {
          "Content-Type": "application/json"
        }
      }).then(async(response) => {
        const { data: json } = await response.json();
        const url = window.URL.createObjectURL(
          new Blob(
            [new Uint8Array(json.data).buffer], { type: "application/pdf" }
          )
        );
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = `${title}.pdf`;
        document.body.appendChild(link);
        link.click();
      }).finally(() => {
        form.querySelector(".spinner").classList.add("hidden");
      });
    }, { once: true });

    return new PopupTemplate(
      "report",
      clone
    );
  }
}
