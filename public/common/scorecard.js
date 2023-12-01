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
 * @param {!number} score
 * @returns {string}
 */
export function getScoreColor(score) {
  if (score < 4) {
    return "red";
  }
  if (score < 6.5) {
    return "orange";
  }
  if (score < 8.5) {
    return "blue";
  }

  return "green";
}

export function getScorecardLink(
  repoName,
  platform
) {
  return `https://kooltheba.github.io/openssf-scorecard-api-visualizer/#/projects/${platform}/${repoName}`;
}
