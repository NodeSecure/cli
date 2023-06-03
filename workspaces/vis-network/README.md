# Vis-network

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fvis-network%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/vis-network)
[![maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/NodeSecure/cli/graphs/commit-activity)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/workspaces/vis-network/LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/nodejs.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%22Node.js+CI%22)

NodeSecure [Vis.js](https://visjs.org/) network front-end module.

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/vis-network
# or
$ yarn add @nodesecure/vis-network
```

## Usage example

```js
// Import Third-party Dependencies
import { NodeSecureDataSet, NodeSecureNetwork } from "@nodesecure/vis-network";

document.addEventListener("DOMContentLoaded", async () => {
  const secureDataSet = new NodeSecureDataSet();
  await secureDataSet.init();

  new NodeSecureNetwork(secureDataSet);
});
```

## API

- [NodeSecureDataSet](./docs/NodeSecureDataSet.md)
- [NodeSecureNetwork](./docs/NodeSecureNetwork.md)

## Scripts

The project scripts are used for those who want to test the code.

- **npm start** to start an httpserver from `./dist`
- **npm run build** to build the `./example` with esbuild.

> **Note**: The start command run the build command before launching the http server.

## License

MIT
