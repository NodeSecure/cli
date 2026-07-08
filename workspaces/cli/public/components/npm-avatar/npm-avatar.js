// Import Third-party Dependencies
import { LitElement, html } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import avatarURL from "../../img/avatar-default.png";

export class NpmAvatar extends LitElement {
  static properties = {
    imgStyle: { type: String },
    avatar: { type: String },
    email: { type: String }
  };

  render() {
    return when(
      this.avatar,
      () => html`<img style="${this.imgStyle}"  src="https://www.npmjs.com/${this.avatar}"
              @error=${(e) => {
                e.currentTarget.src = avatarURL;
              }}></img>`,
      () => html`<img style="${this.imgStyle}" src="https://unavatar.io/${this.email}"
               @error=${(e) => {
                  e.currentTarget.src = avatarURL;
                }}></img>`
    );
  }
}

customElements.define("npm-avatar", NpmAvatar);
