// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

/**
 * @typedef {Object} ScorecardCheckDocumentation
 * @property {string} short
 * @property {string} url
 */

/**
 * @typedef {Object} ScorecardCheck
 * @property {string} name
 * @property {number} score
 * @property {string} reason
 * @property {string[] | null} details
 * @property {ScorecardCheckDocumentation} documentation
 */

/**
 * @typedef {Object} ScorecardRepo
 * @property {string} name
 * @property {string} commit
 */

/**
 * @typedef {Object} ScorecardTool
 * @property {string} version
 * @property {string} commit
 */

/**
 * @typedef {Object} ScorecardData
 * @property {string} date
 * @property {ScorecardRepo} repo
 * @property {ScorecardTool} scorecard
 * @property {number} score
 * @property {ScorecardCheck[]} checks
 */

/**
 * @param {!string} repoName
 * @param {string} platform
 * @returns {Promise<ScorecardData | null>}
 */
export async function fetchScorecardData(repoName, platform = "github.com") {
  try {
    /** @type any responseRaw */
    const responseRaw = (await getJSON(`/scorecard/${repoName}?platform=${platform}`));

    /** @type {{ data: ScorecardData }} */
    const response = responseRaw;

    const data = response.data;
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

/**
 * @param {string} repoName
 * @param {string} platform
 * @returns {string}
 */
export function getScorecardLink(
  repoName,
  platform
) {
  return `https://ossf.github.io/scorecard-visualizer/#/projects/${platform}/${repoName}`;
}
