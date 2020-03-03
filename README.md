# node-secure
![ver](https://img.shields.io/github/package-json/v/ES-Community/node-secure?style=flat-square)
![license](https://img.shields.io/github/license/ES-Community/node-secure?style=flat-square)
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
![dep](https://img.shields.io/david/ES-Community/node-secure?style=flat-square)
![size](https://img.shields.io/github/languages/code-size/ES-Community/node-secure?style=flat-square)

[Node.js](https://nodejs.org/en/) security Command Line Interface. The goal of the project is to a design a CLI/API that will fetch and deeply analyze the dependency tree of a given **npm** package (Or a local project with a **package.json**) and output a **.json file** that will contains all metadata and flags about each packages.

The CLI allow to load the JSON into a Webpage that will draw a Network (with [vis.js](https://visjs.org/)) of all dependencies in a webpage (example in the screenshot below).

- [NodeSecure G.Drive Design document](https://docs.google.com/document/d/1853Uwup9mityAYqAOnen1KSqSA6hlBgpKU0u0ygGY4Y/edit?usp=sharing)

<p align="center">
<img src="https://i.imgur.com/w9xynjJ.png">
</p>

## Requirements

- [Node.js](https://nodejs.org/en/) version 12.12.0 or higher

## Getting Started

```bash
$ npm install nsecure -g
```

or

```bash
$ git clone https://github.com/ES-Community/nsecure.git
$ cd nsecure
$ npm ci
$ npm link
```

Then the **nsecure** binary will be available in your terminal. Give a try on [express](http://expressjs.com/).
```bash
$ nsecure auto express
```

> ⚠️ Setup an npm token to avoid hiting the maximum request limit on the npm registry.

## Usage example

To show the complete list of commands
```bash
$ nsecure --help
```

---

```bash
# Run an analysis on the current working dir (must have a package.json file).
$ nsecure cwd

# Run an analysis for a given 'npm' package (must be in the npm registry).
$ nsecure from @sindresorhus/is
```

Then a `nsecure-result.json` will be writted at the current CLI location. To open it on a web page just run

```bash
$ nsecure open
```

The `auto` command can be used to chain `cwd/from` and `open` commands automatically.

```bash
$ nsecure auto jest

# if no package is given to the auto command then it will run the cwd command instead of from.
$ nsecure auto
```

---
Some options are available on both `cwd`, `from` and `auto` commands. The output option is not available for the `auto` command.

| name | shortcut | default value | description |
| --- | --- | --- | --- |
| --depth | -d | **4** | the maximum depth we must walk (when we fetch the whole tree). |
| --output | -o | **nsecure-result** | the name that the outputted .json file will have |

```bash
$ nsecure from express -d 10 -o express-security-report
```

## Private packages / registry

Nsecure allow you to fetch stats on private npm packages by setting up a `NODE_SECURE_TOKEN` env variable (which must contains a [npm token](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)).

> 👀 If you'r linking the package yourself you can create a `.env` file at the root of the project too.

Nsecure is capable to work behind a custom private npm registry too by searching the default registry URL in your local npm configuration.

```bash
$ npm config get registry
$ npm config set "http://your-registry/"
```

## API
Use nsecure as an API package to fetch and work with the generated JSON. The following example demonstrates how to retrieve the Payload for mocha, cacache and is-wsl packages. It's possible to use the **cwd** method if you want to achieve similar work on a local project.

```js
const { from } = require("nsecure");
const { writeFile } = require("fs").promises;

async function main() {
    const toFetch = ["mocha", "cacache", "is-wsl"];
    const options = { verbose: false };

    const payloads = await Promise.all(
        toFetch.map((name) => from(name, options))
    );

    const toWritePromise = [];
    for (let i = 0; i < toFetch.length; i++) {
        const data = JSON.stringify(payloads[i], null, 2);
        toWritePromise.push(writeFile(`${toFetch[i]}.json`, data));
    }
    await Promise.all(toWritePromise);
}
main().catch(console.error);
```

The SlimIO [Security project](https://github.com/SlimIO/Security) use nsecure with the API to analyze packages and repositories of a given github organization (or user).

## Flags legends

Flags and emojis legends are documented [here](./FLAGS.md).

## FAQ

### Why some nodes are red in the UI ?
Nodes are red when the project/package has been flagged with 🔬 `hasMinifiedCode` or ⚠️ `hasWarnings`.

### Why the node-secure package size is so different from Bundlephobia ?
Node-secure will analyze the complete size of the npm tarball with no filters or particular optimization. Bundlephobia on the
other side will bundle and remove most of the useless files from the tarball (Like the documentation, etc.).

## License
MIT

[travis-image]: https://img.shields.io/travis/com/ES-Community/node-secure/master.svg?style=flat-square
[travis-url]: https://travis-ci.com/ES-Community/node-secure
[codecov-image]: https://img.shields.io/codecov/c/github/ES-Community/node-secure.svg?style=flat-square
[codecov-url]: https://codecov.io/github/ES-Community/node-secure
