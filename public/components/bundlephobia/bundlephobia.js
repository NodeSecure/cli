// Import Third-party Dependencies
import prettyBytes from "pretty-bytes";
import { getJSON } from "@nodesecure/vis-network";
import { LitElement, html, css } from "lit";
import { Task } from "@lit/task";

class Bundlephobia extends LitElement {
  /*
   TODO: the css has been duplicated for now but once we migrated the code that use bundlephobia.css to lit
   we should reuse this css in each lit component
  * */
  static styles = css`
 div.bundlephobia {
  height: 50px;
  display: flex;
  margin-top: 10px;
}

 div.bundlephobia>div {
  height: inherit;
  box-sizing: border-box;
  border-radius: 4px;
  border: 2px dashed var(--secondary);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 1px 1px 10px rgb(41 103 122 / 30%) inset;
}

 div.bundlephobia>div+div {
  margin-left: 10px;
}

 div.bundlephobia>div>b {
  font-weight: 800;
  color: var(--secondary);
  margin-bottom: 5px;
  font-size: 18px;
}

 div.bundlephobia>div>b i {
  font-family: mononoki;
  font-size: 14px;
  color: #fce12b;
}

 div.bundlephobia>div>span {
  font-size: 12px;
  font-family: mononoki;
  text-transform: uppercase;
}

.head-title {
  background: var(--primary-darker);
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--primary-lighter);
  border-radius: 2px 2px 0 0;
}

.head-title>p {
  text-shadow: 1px 1px 5px rgb(20 20 20 / 50%);
  font-size: 18px;
  font-variant: small-caps;

  /* lowercase is needed with small-caps font variant */
  text-transform: lowercase;
  font-family: mononoki;
  font-weight: bold;
  letter-spacing: 1px;
  padding: 0 10px;
}
`;

  static get DEFAULT_SIZE() {
    return "N/A";
  }
  static properties = {
    name: { type: String },
    version: { type: String }
  };

  #bunldeTask = new Task(this, {
    task: async([name, version]) => {
      const {
        gzip, size, dependencySizes
      } = await getJSON(`/bundle/${this.#httpName(name)}/${version}`);
      const fullSize = dependencySizes.reduce((prev, curr) => prev + curr.approximateSize, 0);

      return {
        gzip: prettyBytes(gzip),
        min: prettyBytes(size),
        full: prettyBytes(fullSize)
      };
    },
    args: () => [this.name, this.version]
  });

  #httpName(name) {
    return name.replaceAll("/", "%2F");
  }

  render() {
    return this.#bunldeTask.render({
      pending: () => this.#bundlephobiaTemplate(),
      complete: (bundle) => this.#bundlephobiaTemplate(bundle),
      error: () => this.#bundlephobiaTemplate()
    });
  }

  #bundlephobiaTemplate(bundle = {
    gzip: Bundlephobia.DEFAULT_SIZE,
    min: Bundlephobia.DEFAULT_SIZE,
    full: Bundlephobia.DEFAULT_SIZE
  }) {
    const { gzip, min, full } = bundle;

    return html`
    <div class="head-title">
      <p>bundlephobia</p>
    </div>
    <div class="bundlephobia" id="bundlephobia-sizes">
      <div>
        <b class="size-min">${min}</b>
        <span>MIN</span>
      </div>
      <div>
        <b class="size-gzip">${gzip}</b>
        <span>GZIP</span>
      </div>
      <div>
        <b class="size-full">${full}</b>
        <span>FULL</span>
      </div>
    </div>
`;
  }
}

customElements.define("bundle-phobia", Bundlephobia);

