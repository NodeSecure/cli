<p align="center"><h1 align="center">
  🐤 Documentation and Wiki UI 👀
</h1>

<p align="center">
    <a href="https://www.npmjs.com/package/nsecure">
      <img src="https://img.shields.io/github/package-json/v/NodeSecure/documentation-ui?style=for-the-badge" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/nsecure">
      <img src="https://img.shields.io/github/license/NodeSecure/documentation-ui?style=for-the-badge" alt="license">
    </a>
    <a href="https://api.securityscorecards.dev/projects/github.com/NodeSecure/documentation-ui">
      <img src="https://api.securityscorecards.dev/projects/github.com/NodeSecure/documentation-ui/badge?style=for-the-badge" alt="ossf scorecard">
    </a>
</p>

<p align="center">
<img src="https://i.imgur.com/Bo21VnK.png">
</p>

## 📢 About

Portable documentation/wiki UI for NodeSecure tools like [CLI](https://github.com/NodeSecure/cli) or [Preview](https://github.com/NodeSecure/preview). This package has been designed with the objective of rendering the same documentation to all developers whatever the tool they use.

## 📜 Features

- Render [NodeSecure flags](https://github.com/NodeSecure/flags/blob/main/FLAGS.md) using the package `@nodesecure/flags`.
- Render [NodeSecure JS-X-RAY SAST Warnings](https://github.com/NodeSecure/js-x-ray).
- Written in vanilla.js for maximum performance.

> **Note** The content is retrieved from the github API (and sometimes it transform raw markdown response to HTML, that's why we use [markdown-it](https://github.com/markdown-it/markdown-it#readme) as dependency).

## 💃 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/documentation-ui
# or
$ yarn add @nodesecure/documentation-ui
```

## 👀 Usage example

```js
// Import Third-party Dependencies
import * as documentationUI from "@nodesecure/documentation-ui";

document.addEventListener("DOMContentLoaded", async () => {
  const documentRootElement = document.getElementById("whatever-you-want");

  const wiki = documentationUI.render(documentRootElement, {
    prefetch: true,
  });

  console.log(`Available views: ${[...wiki.header.views.keys()].join(",")}`);
  wiki.header.setNewActiveView("warnings");

  // Note: you can also enumerate menus with `wiki.navigation.warnings.menus.keys()`
  wiki.navigation.warnings.setNewActiveMenu("unsafe-stmt");
});
```

The `render` API take an options payload describe by the following TS interface:

```ts
export interface RenderDocumentationUIOptions {
  /**
   * Prefetch all flags and cache them
   *
   * @default true
   */
  prefetch?: boolean;
}
```

### Fetch assets required for the bundler

An incomplete example for esbuild.

```js
// Import Third-party Dependencies
import { getBuildConfiguration } from "@nodesecure/documentation-ui/node";
import esbuild from "esbuild";

// Note: all entry points for assets (css etc..).
const { entryPoints } = getBuildConfiguration();

await esbuild.build({
  entryPoints: [...entryPoints],
});
```

## API

### render(rootElement: HTMLElement, options: RenderDocumentationUIOptions): RenderResult;

Render the documentation in the given root element.

```ts
export interface RenderResult {
  header: Header;
  navigation: {
    flags: Navigation;
    warnings: Navigation;
  };
}
```

<details><summary>Header & Navigation definition</summary>

```ts
class Header {
  active: HTMLElement;
  views: Map<string, HTMLElement>;
  defaultName: string | null;

  setNewActiveView(name: string): void;
}

class Navigation {
  active: HTMLElement;
  menus: Map<string, HTMLElement>;
  defaultName: string | null;
  prefetch: boolean;
  fetchCallback: (name: string, menu: HTMLElement) => any;

  setNewActiveMenu(name: string): void;
}
```

</details>

## How to contribute/work on this project

You can use the local `example/` to work on any updates. Just use the `example` npm script:

```bash
$ npm ci
$ npm run example
```

```json
"scripts": {
  "example": "npm run example:build && http-server ./dist",
  "example:build": "node esbuild.config.js"
}
```

## License

MIT
