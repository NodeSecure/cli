# `size-satisfies`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fsize-satisfies%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/size-satisfies)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/workspaces/size-satisfies/LICENSE)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/size-satisfies?style=for-the-badge)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/size-satisfies.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%22Size+Satisfies+CI%22)

Same as SemVer.satisfies but for file size!

## Requirements

- [Node.js](https://nodejs.org/en/) v18 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @nodesecure/size-satisfies
# or
$ yarn add @nodesecure/size-satisfies
```

## Usage example

```js
import { strict } from "assert";
import sizeSatisfies from "size-satisfies";

const { strictEqual } = strict;

strictEqual(sizeSatisfies(">= 45KB", "20MB"), true);
strictEqual(sizeSatisfies("= 1MB", "1MB"), true);
strictEqual(sizeSatisfies("= 1MB", 2000), false);
```

The first argument of the `sizeSatisfies` method is the pattern with the operator + size. Available operators are `>=`, `<=`, `>`, `<`, `=`.

## API

### sizeSatisfies(pattern: string, size: number | string): boolean

When the size is a string we convert it to a bytes number. When the argument is a number we consider the value as bytes.

Invalid pattern will always return **false**.

## License

MIT
