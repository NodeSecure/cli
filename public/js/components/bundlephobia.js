// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";
import { getJSON } from "@nodesecure/vis-network";

export class Bundlephobia {
  /**
   * @param {!string} name
   * @param {!string} version
   */
  constructor(name, version) {
    this.name = name;
    this.version = version;
  }

  get httpName() {
    return this.name.replace("/", "%2F");
  }

  async fetchDataOnHttpServer() {
    const [sizeGzip, sizeMin, sizeFull] = [
      document.querySelector(".size-gzip"),
      document.querySelector(".size-min"),
      document.querySelector(".size-full")
    ];

    try {
      const {
        gzip, size, dependencySizes
      } = await getJSON(`/bundle/${this.httpName}/${this.version}`);
      const fullSize = dependencySizes.reduce((prev, curr) => prev + curr.approximateSize, 0);

      const result = {
        gzip: prettyBytes(gzip),
        min: prettyBytes(size),
        full: prettyBytes(fullSize)
      };

      sizeGzip.textContent = result.gzip;
      sizeMin.textContent = result.min;
      sizeFull.textContent = result.full;

      return result;
    }
    catch {
      return null;
    }
  }
}
