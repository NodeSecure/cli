<p align="center"><h1 align="center">
  🐢 Node-Secure CLI 🚀
</h1>

<p align="center">
  a Node.js CLI to deeply analyze the dependency tree of a given package / directory
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/nsecure"><img src="https://img.shields.io/github/package-json/v/NodeSecure/cli?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/nsecure"><img src="https://img.shields.io/github/license/NodeSecure/cli?style=flat-square" alt="license"></a>
    <a href="https://github.com/NodeSecure/cli/actions?query=workflow%3A%22Node.js+CI%22"><img src="https://img.shields.io/github/workflow/status/NodeSecure/cli/Node.js%20CI/master?style=flat-square" alt="github ci workflow"></a>
    <a href="https://codecov.io/github/ES-Community/nsecure"><img src="https://img.shields.io/codecov/c/github/ES-Community/nsecure.svg?style=flat-square" alt="codecov"></a>
    <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg?style=flat-square" alt="Responsible Disclosure Policy" /></a>
    <a href="https://www.npmjs.com/package/nsecure"><img src="https://img.shields.io/npm/dw/nsecure?style=flat-square" alt="downloads"></a>
</p>


<p align="center">
<img src="https://res.cloudinary.com/practicaldev/image/fetch/s--uxkBbhI2--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zxtg6o2v2ahmpsjfhs71.PNG">
</p>

## 📢 About

[Node.js](https://nodejs.org/en/) security Command Line Interface. The goal of the project is to a design a CLI/API that will fetch and deeply analyze the dependency tree of a given **npm** package (Or a local project with a **package.json**) and output a **.json file** that will contains all metadata and flags about each packages. All this data will allow to quickly identify different issues across projects and packages (related to security and quality).

The CLI allow to load the JSON into a Webpage with the **open** command. The page will draw a Network of all dependencies with [vis.js](https://visjs.org/) (example in the screenshot above). We also wrote a little Google drive document a while ago that summarizes some of these points:

- [NodeSecure G.Drive Design document](https://docs.google.com/document/d/1853Uwup9mityAYqAOnen1KSqSA6hlBgpKU0u0ygGY4Y/edit?usp=sharing)

## 📜 Features

- Run an AST analysis on each .js/.mjs file in the packages tarball and sort out warnings (unsafe-regex, unsafe-import etc) and the complete list of required expr and statements (files, node.js module, etc.).
- Return complete composition for each packages (extensions, files, tarball size, etc).
- Packages metadata from the npm registry API (number of releases, last publish date, maintainers etc).
- Search for licenses files in the tarball and return the [SPDX](https://spdx.org/licenses/) expression conformance of each detected licenses.
- Link vulnerabilities from the [Security-WG repository](https://github.com/nodejs/security-wg/tree/master/vuln/npm) to the package version node.
- Add flags to each packages versions to identify well known patterns and potential security threats easily.
- Analyze npm packages and local Node.js projects.

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) LTS 16.x or higher

## 💃 Getting Started

```bash
$ npm install @nodesecure/cli -g
```

or

```bash
$ git clone https://github.com/NodeSecure/cli.git
$ cd cli
$ npm ci
$ npm run build
$ npm link
```

Then the **nsecure** binary will be available in your terminal. Give a try with the popular [express](http://expressjs.com/) package. This will automatically open the webpage in your default system browser.
```bash
$ nsecure auto express
```

> ⚠️ Setup an [npm token](https://github.com/NodeSecure/cli#private-packages--registry) to avoid hiting the maximum request limit of the npm registry API.

## 👀 Usage example

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

# If you want to define a specific port use the --port option.
$ nsecure open --port 8080
```
---

##### Available options

| name | shortcut | default value | description |
| --- | --- | --- | --- |
| --port | -p |  | Define the running port, can also be define through the environment variable `PORT` |

The `auto` command can be used to chain `cwd/from` and `open` commands automatically.

```bash
$ nsecure auto jest

# if no package is given to the auto command then it will run the cwd command instead of from.
$ nsecure auto
```

> 👀 By default with the auto command the .json file is deleted when the http server is closed. It's possible to disable this behavior by using the CLI option `--keep`, `-k`.

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

Nsecure allow you to fetch stats on private npm packages by setting up a `NODE_SECURE_TOKEN` env variable (which must contains an [npm token](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)).

> 💬 If you link the package by yourself with npm you can create a `.env` file at the root of the project too.

Nsecure is capable to work behind a custom private npm registry too by searching the default registry URL in your local npm configuration.

```bash
$ npm config get registry
$ npm config set "http://your-registry/"
```

## API
Our back-end scanner package is available [here](https://github.com/NodeSecure/scanner).

## Flags legends

Flags and emojis legends are documented [here](https://github.com/NodeSecure/flags/blob/main/FLAGS.md).

## Searchbar filters

Since version 0.6.0 of Node-secure the UI include a brand new searchbar that allow to search anything on the tree (graph) by multiple criteria (filters). The current available filters are:

- package (**the default filter if there is none**).
- version (take a semver range as an argument).
- flag (list of available flags in the current payload/tree).
- license (list of available licenses in the current payload/tree).
- author (author name/email/url).
- ext (list of available file extensions in the current payload/tree).
- builtin (available Node.js core module name).
- size

Exemple of query:

```
version: >=1.2 | 2, ext: .js, builtin: fs
```

## FAQ

### Why some nodes are red in the UI ?
Nodes are red when the project/package has been flagged with 🔬 `hasMinifiedCode` or ⚠️ `hasWarnings`.

### Why the node-secure package size is so different from Bundlephobia ?
Node-secure will analyze the complete size of the npm tarball with no filters or particular optimization. Bundlephobia on the
other side will bundle and remove most of the useless files from the tarball (Like the documentation, etc.).

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://mickaelcroquet.fr"><img src="https://avatars2.githubusercontent.com/u/23740372?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Haze</b></sub></a><br /><a href="https://github.com/NodeSecure/cli/commits?author=CroquetMickael" title="Code">💻</a> <a href="#design-CroquetMickael" title="Design">🎨</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars3.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>fraxken</b></sub></a><br /><a href="https://github.com/NodeSecure/cli/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/NodeSecure/cli/issues?q=author%3Afraxken" title="Bug reports">🐛</a> <a href="#blog-fraxken" title="Blogposts">📝</a> <a href="https://github.com/NodeSecure/cli/commits?author=fraxken" title="Tests">⚠️</a> <a href="https://github.com/NodeSecure/cli/commits?author=fraxken" title="Documentation">📖</a> <a href="#design-fraxken" title="Design">🎨</a></td>
    <td align="center"><a href="https://stouder.io"><img src="https://avatars2.githubusercontent.com/u/2575182?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Xavier Stouder</b></sub></a><br /><a href="https://github.com/NodeSecure/cli/commits?author=Xstoudi" title="Code">💻</a> <a href="#design-Xstoudi" title="Design">🎨</a> <a href="https://github.com/NodeSecure/cli/commits?author=Xstoudi" title="Documentation">📖</a></td>
    <td align="center"><a href="http://tonygo.dev"><img src="https://avatars0.githubusercontent.com/u/22824417?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tony Gorez</b></sub></a><br /><a href="https://github.com/NodeSecure/cli/commits?author=tony-go" title="Code">💻</a> <a href="https://github.com/NodeSecure/cli/commits?author=tony-go" title="Documentation">📖</a> <a href="https://github.com/NodeSecure/cli/pulls?q=is%3Apr+reviewed-by%3Atony-go" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/abdellah-housni"><img src="https://avatars.githubusercontent.com/u/39569278?v=4?s=100" width="100px;" alt=""/><br /><sub><b>abdellah-housni</b></sub></a><br /><a href="https://github.com/NodeSecure/cli/issues?q=author%3Aabdellah-housni" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License
MIT
