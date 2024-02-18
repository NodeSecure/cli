// Import Third-party Dependencies
import { getJSON } from "@nodesecure/vis-network";

export class i18n {
  async fetch() {
    return await getJSON(`/i18n`);
  }
}
