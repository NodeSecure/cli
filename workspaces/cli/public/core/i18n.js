// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

export class i18n {
  /**
   * @returns {Promise<Record<string, Record<string, Record<string, string>>>>}
   */
  async fetch() {
    return /** @type {Record<string, Record<string, Record<string, string>>>} */ (await getJSON("/i18n"));
  }
}
