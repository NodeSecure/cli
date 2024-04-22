// Import Third-party Dependencies
import { getScoreColor, getVCSRepositoryPathAndPlatform } from "@nodesecure/utils";

// Import Internal Dependencies
import * as utils from "../../../../common/utils.js";
import { fetchScorecardData, getScorecardLink } from "../../../../common/scorecard.js";

export class Scorecard {
  constructor(pkg) {
    this.package = pkg;
  }

  hide() {
    const scorecardMenu = document.getElementById("scorecard-menu");
    if (scorecardMenu) {
      scorecardMenu.style.display = "none";
    }
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    // Note: links.github.href can be a gitlab link
    // Both links.github & links.gitlab are same, the showInHeader defines wheither its a gitlab or github link
    const [repoName, platform] = getVCSRepositoryPathAndPlatform(this.package.links.github.href) ?? [];
    const pannel = clone.getElementById("pan-scorecard");

    fetchScorecardData(repoName, platform).then((data) => {
      if (!data) {
        return this.hide();
      }

      pannel.appendChild(this.renderScorecard(data, repoName, platform));
      document.getElementById("scorecard-menu").style.display = "flex";

      return void 0;
    });
  }

  renderScorecard(data, repoName, platform) {
    const { score, checks } = data;

    const container = utils.createDOMElement("div", {
      classList: ["checks"]
    });

    for (const check of checks) {
      container.append(generateCheckElement(check));
    }

    document.getElementById("ossf-score").innerText = score;
    document.getElementById("scorecard-menu").classList.add(
      getScoreColor(score)
    );
    document.getElementById("head-score").innerText = score;
    document
      .querySelector(".score-header .visualizer a")
      .setAttribute("href", getScorecardLink(repoName, platform));

    container.childNodes.forEach((check, checkKey) => {
      check.addEventListener("click", () => {
        if (check.children[2].classList.contains("visible")) {
          check.children[2].classList.remove("visible");
          check.classList.remove("visible");

          return;
        }

        check.classList.add("visible");
        check.children[2].classList.add("visible");

        container.childNodes.forEach((check, key) => {
          if (checkKey !== key) {
            check.classList.remove("visible");
            check.children[2].classList.remove("visible");
          }
        });
      });
    });

    return container;
  }
}

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
    fragment.querySelector(".info").appendChild(
      utils.createDOMElement("div", {
        classList: ["detail"],
        text: detail
      })
    );
  }

  return fragment;
}
