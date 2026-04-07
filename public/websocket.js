/**
 * @typedef {string | object} Spec
 */

export class WebSocketClient extends EventTarget {
  /** @type {WebSocket} */
  client;

  constructor(
    /** @type {String} */
    url
  ) {
    super();
    this.client = new WebSocket(url);
    this.client.addEventListener("message", this.#messageHandler.bind(this));
    this.commands = {
      search: /** @param {Spec} spec */ (spec) =>
        this.send({ commandName: "SEARCH", spec }),
      remove: /** @param {Spec} spec */ (spec) =>
        this.send({ commandName: "REMOVE", spec }),
    };

    window.socket = this;
    window.onbeforeunload = () => {
      this.close();
    };
  }

  /** @type {(data: Record<string, any>) => void} */
  send(data) {
    this.client.send(JSON.stringify(data));
  }

  /**
   * @param {MessageEvent} event
   */
  #messageHandler(event) {
    /** @type {{ status: string, [key: string]: any }} */
    const data = JSON.parse(event.data);
    if (!data.status) {
      console.warn("[WEBSOCKET] Received data without status:", data);

      return;
    }

    console.log(`[WEBSOCKET] data status = '${data.status}'`);
    this.dispatchEvent(new CustomEvent(data.status, { detail: data }));
  }

  close() {
    this.client.onclose = () => void 0;
    this.client.close();
  }
}
