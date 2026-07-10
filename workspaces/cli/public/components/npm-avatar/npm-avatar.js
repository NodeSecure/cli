/* eslint-disable @openally/imports */
// Import Third-party Dependencies
import { LitElement, html } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
// @ts-expect-error - static asset import has no type declarations; the bundler resolves it to a URL string
import avatarURL from "../../img/avatar-default.png";

export class NpmAvatar extends LitElement {
  static properties = {
    imgStyle: { type: String },
    avatar: { type: String },
    email: { type: String }
  };

  constructor() {
    super();
    /** @type {string} */
    this.imgStyle = "";
    /** @type {string} */
    this.avatar = "";
    /** @type {string} */
    this.email = "";
  }

  render() {
    return when(
      this.avatar,
      () => html`<img style="${this.imgStyle}"  src="https://www.npmjs.com/${this.avatar}"
              @error=${(/** @type {Event} */ e) => {
                /** @type {HTMLImageElement} */ (e.currentTarget).src = avatarURL;
              }}></img>`,
      () => html`<img style="${this.imgStyle}" src="https://unavatar.io/${this.email}"
               @error=${(/** @type {Event} */ e) => {
                  /** @type {HTMLImageElement} */ (e.currentTarget).src = avatarURL;
                }}></img>`
    );
  }
}

customElements.define("npm-avatar", NpmAvatar);
