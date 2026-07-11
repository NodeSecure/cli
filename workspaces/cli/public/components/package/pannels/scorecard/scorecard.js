// Import Third-party Dependencies
import { getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import { fetchScorecardData, getScorecardLink } from "../../../../common/scorecard.js";

export class Scorecard {
  /**
   * @param {import("../../package.js").PackageInfo} pkg
   */
  constructor(pkg) {
    this.package = pkg;
  }

  hide() {
    const scorecardMenu = /** @type {HTMLElement | null} */ (document.getElementById("scorecard-menu"));
    if (scorecardMenu) {
      scorecardMenu.style.display = "none";
    }
  }

  /**
   * @param {!DocumentFragment} clone
   */
  generate(clone) {
    // Note: links.github.href can be a gitlab link
    // Both links.github & links.gitlab are same, the showInHeader defines wheither its a gitlab or github link
    const [repoNameRaw, platformRaw] = getVCSRepositoryPathAndPlatform(
      /** @type {string} */ (this.package.links.github.href)
    ) ?? [];
    const repoName = /** @type {string} */ (repoNameRaw);
    const platform = /** @type {string} */ (platformRaw);
    const pannel = /** @type {HTMLElement} */ (clone.getElementById("pan-scorecard"));

    fetchScorecardData(repoName, platform).then((data) => {
      if (!data) {
        return this.hide();
      }

      pannel.appendChild(this.renderScorecard(data, repoName, platform));
      /** @type {HTMLElement} */ (document.getElementById("scorecard-menu")).style.display = "flex";

      return void 0;
    });
  }

  /**
   * @param {import("../../../../common/scorecard.js").ScorecardData} data
   * @param {string} repoName
   * @param {string} platform
   */
  renderScorecard(data, repoName, platform) {
    const { score, checks } = data;

    const container = utils.createDOMElement("div", {
      classList: ["checks"]
    });

    for (const check of checks) {
      container.append(generateCheckElement(check));
    }

    /** @type {HTMLElement} */ (document.getElementById("ossf-score")).innerText = String(score);
    /** @type {HTMLElement} */ (document.getElementById("scorecard-menu")).classList.add(
      getScoreColor(score)
    );
    /** @type {HTMLElement} */ (document.getElementById("head-score")).innerText = String(score);
    /** @type {HTMLElement} */ (document
      .querySelector(".score-header .visualizer a"))
      .setAttribute("href", getScorecardLink(repoName, platform));

    container.childNodes.forEach((checkNode, checkKey) => {
      const check = /** @type {HTMLElement} */ (checkNode);
      check.addEventListener("click", () => {
        if (check.children[2].classList.contains("visible")) {
          check.children[2].classList.remove("visible");
          check.classList.remove("visible");

          return;
        }

        check.classList.add("visible");
        check.children[2].classList.add("visible");

        container.childNodes.forEach((otherCheckNode, key) => {
          const otherCheck = /** @type {HTMLElement} */ (otherCheckNode);
          if (checkKey !== key) {
            otherCheck.classList.remove("visible");
            otherCheck.children[2].classList.remove("visible");
          }
        });
      });
    });

    return container;
  }
}

/**
 * @param {import("../../../../common/scorecard.js").ScorecardCheck} check
 */
function generateCheckElement(check) {
  if (!check.score || check.score < 0) {
    check.score = 0;
  }

  const fragment = document.createDocumentFragment();
  fragment.appendChild(
    utils.createDOMElement("div", {
      classList: ["check"],
      childs: [
        utils.createDOMElement("span", {
          classList: ["name"],
          text: check.name
        }),
        utils.createDOMElement("div", {
          classList: ["score"],
          text: `${check.score}/10`
        }),
        utils.createDOMElement("div", {
          classList: ["info"],
          childs: [
            utils.createDOMElement("div", {
              classList: ["description"],
              text: check.documentation.short
            }),
            utils.createDOMElement("div", {
              classList: ["reason"],
              childs: [
                utils.createDOMElement("p", {
                  childs: [
                    utils.createDOMElement("strong", {
                      text: "Reasoning"
                    })
                  ]
                }),
                utils.createDOMElement("span", {
                  text: check.reason
                })
              ]
            })
          ]
        })
      ]
    })
  );

  for (const detail of check.details ?? []) {
    /** @type {HTMLElement} */ (fragment.querySelector(".info")).appendChild(
      utils.createDOMElement("div", {
        classList: ["detail"],
        text: detail
      })
    );
  }

  return fragment;
}
