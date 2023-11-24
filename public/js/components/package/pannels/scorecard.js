// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

// Import Internal Dependencies
import * as utils from "../../../utils.js";

export class Scorecard {
  static ExternalLinks = {
    visualizer: "https://kooltheba.github.io/openssf-scorecard-api-visualizer/#/projects/github.com/"
  }

  constructor(pkg) {
    this.package = pkg;
  }

  async fetchScorecardData(repoName) {
    try {
      const { data } = (await getJSON(`/scorecard/${repoName}`));
      if (!data) {
        return null;
      }

      return data;
    }
    catch (error) {
      console.error(error);

      return null;
    }
  }

  hide() {
    const scorecardMenu = document.getElementById('scorecard-menu');
    if (scorecardMenu) {
      scorecardMenu.style.display = 'none';
    }
  }

  /**
   * @param {!HTMLTemplateElement} clone
   */
  generate(clone) {
    const githubURL = this.package.links.github;
    if (!githubURL.href) {
      return this.hide();
    }

    const github = new URL(githubURL.href);
    const repoName = github.pathname.slice(
      1,
      github.pathname.includes(".git") ? -4 : github.pathname.length
    );

    const pannel = clone.getElementById("pan-scorecard");
    this.fetchScorecardData(repoName).then((data) => {
      if (!data) {
        return this.hide();
      }

      pannel.appendChild(this.renderScorecard(data, repoName));
      document.getElementById('scorecard-menu').style.display = 'flex';
    });
  }

  renderScorecard(data, repoName) {
    const { score, checks } = data;

    const container = utils.createDOMElement('div', {
      classList: ['checks'],
    });

    for (const check of checks) {
      container.append(generateCheckElement(check));
    }

    document.getElementById('ossf-score').innerText = score;
    document.getElementById('head-score').innerText = score;
    document
      .querySelector(".score-header .visualizer a")
      .setAttribute('href', Scorecard.ExternalLinks.visualizer + repoName);

    container.childNodes.forEach((check, checkKey) => {
      check.addEventListener('click', () => {
        if (check.children[2].classList.contains('visible')) {
          check.children[2].classList.remove('visible');
          check.classList.remove('visible')

          return;
        }

        check.classList.add('visible');
        check.children[2].classList.add('visible');

        container.childNodes.forEach((check, key) => {
          if (checkKey !== key) {
            check.classList.remove('visible');
            check.children[2].classList.remove('visible');
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
    utils.createDOMElement('div', {
      classList: ['check'],
      childs: [
        utils.createDOMElement('span', {
          classList: ['name'],
          text: check.name,
        }),
        utils.createDOMElement('div', {
          classList: ['score'],
          text: `${check.score}/10`,
        }),
        utils.createDOMElement('div', {
          classList: ['info'],
          childs: [
            utils.createDOMElement('div', {
              classList: ['description'],
              text: check.documentation.short,
            }),
            utils.createDOMElement('div', {
              classList: ['reason'],
              childs: [
                utils.createDOMElement('p', {
                  childs: [
                    utils.createDOMElement('strong', {
                      text: "Reasoning",
                    }),
                  ],
                }),
                utils.createDOMElement('span', {
                  text: check.reason,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  for (const detail of check.details ?? []) {
    fragment.querySelector('.info').appendChild(
      utils.createDOMElement('div', {
        classList: ['detail'],
        text: detail,
      }),
    );
  }

  return fragment;
}
