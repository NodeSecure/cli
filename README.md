# node-secure
![ver](https://img.shields.io/github/package-json/v/ES-Community/node-secure?style=flat-square)
![license](https://img.shields.io/github/license/ES-Community/node-secure?style=flat-square)
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
![dep](https://img.shields.io/david/ES-Community/node-secure?style=flat-square)
![size](https://img.shields.io/github/languages/code-size/ES-Community/node-secure?style=flat-square)

Node.js security CLI. The goal of the project is to a design a CLI (and a API) that will fetch and deeply analyze the dependency tree of a given **npm** package (or a local project) and output a **.json file** that will contains all metadata and flags about each packages.

The CLI will allow to load this .json to draw a Network of all dependencies in a webpage (example below).

> Note: The TypeScript definition of the .json file can be found in the root file index.d.ts

- [Google Drive Documentation](https://docs.google.com/document/d/1853Uwup9mityAYqAOnen1KSqSA6hlBgpKU0u0ygGY4Y/edit?usp=sharing)

<p align="center">
<img src="https://i.imgur.com/eQhxa5S.png">
</p>

## Requirements

- [Node.js](https://nodejs.org/en/) version 12 or higher

## Getting Started

```bash
$ git clone https://github.com/ES-Community/node-secure.git
$ cd node-secure
$ npm ci
$ npm link
```

or

```bash
$ npm i -g https://github.com/ES-Community/node-secure.git
```

> ⚠️ under development (not published on npm yet).

## Usage example

To show the complete list of commands
```bash
$ nsecure --help
```

---

```bash
# Run analysis on the current working dir
$ nsecure cwd

# Run analysis for a given 'npm' package (must be in the registry).
$ nsecure from @sindresorhus/is
```

Then a `result.json` will be writted at the current location. To view it on web page just run

```bash
$ nsecure http
```

---
Some options are available on both `cwd` and `from` commands.

| name | shortcut | default value | description |
| --- | --- | --- | --- |
| --depth | -d | **4** | the maximum depth we must walk (when we fetch the whole tree). |
| --output | -o | **result** | the name that the outputted .json file will have |

```bash
$ nsecure from express -d 10 -o express-security-report
```

## Fetching private packages

Nsecure allow you to fetch stats on private npm packages by setting up a `NODE_SECURE_TOKEN` env variable (which must contain a [npm token](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)).

## Emojis and flags legends

| emoji | flag name | description |
| --- | --- | --- |
| ☁️ | isGit | The package (project) is a git repository |
| 🌲 | hasIndirectDependencies | The package have indirect dependencies. |
| ⚠️ | hasSuspectImport | The package have suspect import. |
| ⛔️ | isDeprecated | The package has been tagged as deprecated |
| 📜 | hasLicense | The license is missing (or has not been detected) |
| 🔬 | hasMinifiedCode | The package has minified/uglified code |
| 💎 | hasCustomResolver | The package has at least one dependency that is not a npm package (like a git link or a local file link) |
| 🌍 | hasExternalCapacity | The package use at least one Node.js dependency capable to communicate outside or to establish a listening server |
| 💕 | hasManyPublishers | The package has more than one publishers |
| 👥 | hasChangedAuthor | The package "author" field has been updated at least one time |
| 🚨 | vulnerabilities | The package have one or many vulnerabilities |

> Note: **hasManyPublishers** and **hasChangedAuthor** are not flags linked to a given package version (but to the package itself).

## Fetching vulnerabilities

Right now, vulnerabilities are not shipped automatically because it request a manual action to hydrate a local .json file with all detected vulnerabilities from the [Security WG](https://github.com/nodejs/security-wg) repository.

To run the hydratation just run the following command in your terminal:

```bash
$ nsecure hydrate-db
```

## License
MIT

[travis-image]: https://img.shields.io/travis/com/ES-Community/node-secure/master.svg?style=flat-square
[travis-url]: https://travis-ci.com/ES-Community/node-secure
[codecov-image]: https://img.shields.io/codecov/c/github/ES-Community/node-secure.svg?style=flat-square
[codecov-url]: https://codecov.io/github/ES-Community/node-secure
