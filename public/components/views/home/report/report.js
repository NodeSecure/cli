// Import Third-party Dependencies
import { LitElement, html, css, nothing } from "lit";
import { when } from "lit/directives/when.js";

// Import Internal Dependencies
import { EVENTS } from "../../../../core/events";
import { currentLang } from "../../../../common/utils";

class PopupReport extends LitElement {
  static styles = css`
.report--popup {
  min-width: 400px;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.report--popup>.title {
  height: 2px;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}


.light >.title {
  background: #d3d3d387;
}
.dark >.title {
  background: var(--dark-theme-secondary-color);
}

.report--popup>.title>p {
  padding: 0 10px;
  font-family: roboto;
  font-weight: bold;
  letter-spacing: 1.2px;
  font-size: 20px;
}

.dark .title>p {
  background: #303263;
  color: #3cbde5;
}

.light .title>p {
  background: #f5f4f4;
  color: #255471;
}

.report--popup>form {
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-bottom: 0;
}

.report--popup>form label {
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 18px;
}

.dark >form label {
  color: white;
}

.light >form label {
  color: #546884;
}

.report--popup>form input {
  padding: 11px 6px;
  border: none;
  border-left: 4px solid #546884;
  margin-bottom: 10px;
  border-radius: 2px;
  box-shadow: 0 3px 7px 1px rgb(0 0 0 / 10%);
  font-size: 16px;
}

.report--popup>form>button {
  border: none;
  padding: 8px;
  color: white;
  background: #43a82f;
  font-weight: bold;
  cursor: pointer;
  width: 120px;
  margin: auto;
  margin-top: 20px;
  font-size: 16px;
  border-radius: 4px;
}

.report--popup .spinner {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 50%;
  margin-right: 10px;
  border: 3px solid white;
  animation: spinner-from 0.8s infinite linear alternate, spinner-to 1.6s infinite linear;
}


@keyframes spinner-from {
  0% {
     clip-path: polygon(50% 50%, 0 0, 50% 0%, 50% 0%, 50% 0%, 50% 0%, 50% 0%);
  }

  12.5% {
     clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 0%, 100% 0%, 100% 0%);
  }

  25% {
     clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 100% 100%, 100% 100%);
  }

  50% {
     clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
  }

  62.5% {
     clip-path: polygon(50% 50%, 100% 0, 100% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
  }

  75% {
     clip-path: polygon(50% 50%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 50% 100%, 0% 100%);
  }

  100% {
     clip-path: polygon(50% 50%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 0% 100%);
  }
}

@keyframes spinner-to {
  0% {
     transform: scaleY(1) rotate(0deg);
  }

  49.99% {
     transform: scaleY(1) rotate(135deg);
  }

  50% {
     transform: scaleY(-1) rotate(0deg);
  }

  100% {
     transform: scaleY(-1) rotate(-135deg);
  }
}
`;

  static properties = {
    theme: { type: String },
    rootDependencyName: { type: String },
    isLoading: { type: Boolean }
  };

  constructor() {
    super();
    this.isLoading = false;
    this.settingsChanged = ({ detail: { theme } }) => {
      if (theme !== this.theme) {
        this.theme = theme;
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(EVENTS.SETTINGS_SAVED, this.settingsChanged);
    super.disconnectedCallback();
  }

  firstUpdated() {
    const isLightPreference = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    if (isLightPreference) {
      this.renderRoot.querySelector("#lightTheme").checked = true;
    }
    else {
      this.renderRoot.querySelector("#darkTheme").checked = true;
    }
  }

  render() {
    const { popup: { report } } = window.i18n[currentLang()];
    const defaultTitle = `${this.rootDependencyName}'s report`;

    return html`
  <div class="${this.theme} report--popup">
    <div class="title">
      <p>${report.title}</p>
    </div>
    <form action="" @submit=${this.handleSubmit}>
      <label for="title">${report.form.title}</label>
      <input @input=${(e) => {
        e.stopPropagation();
      }}  placeholder=${defaultTitle} type="text" id="title" name="title">
      <div>
        <input type="checkbox" id="includesAllDeps" name="includesAllDeps" value="includesAllDeps" checked>
        <label for="includesAllDeps">${report.form.includesAllDeps}</label>
      </div>
      <div>
        <input type="radio" id="darkTheme" name="theme" value="dark" />
        <label for="darkTheme">${report.form.dark_theme}</label>
      </div>
      <div>
        <input type="radio" id="lightTheme" name="theme" value="light" />
        <label for="dewey">${report.form.light_theme}</label>
      </div>
      <button type="submit">
        ${when(this.isLoading,
            () => html`<span class="spinner"></span>`,
            () => nothing)
        }
        ${report.form.submit}
      </button >
    </form >
  </div >
  `;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    const formData = new FormData(e.target);
    const title = formData.get("title") || `${this.rootDependencyName} 's report`;
    const theme = formData.get("theme");
    const includesAllDeps = formData.get("includesAllDeps") === "includesAllDeps";

    fetch("/report", {
      method: "POST",
      body: JSON.stringify({
        title,
        includesAllDeps,
        theme
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(async(response) => {
      const { data: json } = await response.json();
      const url = window.URL.createObjectURL(
        new Blob(
          [new Uint8Array(json.data).buffer], { type: "application/pdf" }
        )
      );
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
    }).finally(() => {
      this.isLoading = false;
    });
  };
}

customElements.define("popup-report", PopupReport);
