// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

/**
 * @param {!string} repoName
 */
export async function fetchScorecardData(repoName, platform = "github.com") {
  try {
    const { data } = (await getJSON(`/scorecard/${repoName}?platform=${platform}`));
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
