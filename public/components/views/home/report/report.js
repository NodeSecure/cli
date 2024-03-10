// Import Internal Dependencies
import { PopupTemplate } from "../../../popup/popup.js";

export class PopupReport {
  constructor(data) {
    this.data = data;
  }

  render() {
    const templateElement = document.getElementById("report-popup-template");
    /** @type {HTMLElement} */
    const clone = templateElement.content.cloneNode(true);
    const form = clone.querySelector("form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      form.querySelector(".spinner").classList.remove("hidden");
      const title = form.querySelector("#title").value;
      const includesAllDeps = form.querySelector("#includesAllDeps").checked;

      fetch("/report", {
        method: "POST",
        body: JSON.stringify({
          title,
          includesAllDeps
        })
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
