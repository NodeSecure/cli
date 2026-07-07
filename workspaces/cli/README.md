<p align="center"><h1 align="center">
  🐢 Node-Secure CLI 🚀
</h1>

<p align="center">
  a Node.js CLI to deeply analyze the dependency tree of a given NPM package or Node.js local app
</p>

<p align="center">
<img src="./docs/ui-preview.PNG">
</p>

## 📜 Features

- Run a static scan on every JavaScript files and sort out warnings (unsafe-regex, unsafe-import etc) and the complete list of required expr and statements (files, node.js module, etc.).
- Return complete composition for each packages (extensions, files, tarball size, etc).
- Packages metadata from the npm registry API (number of releases, last publish date, maintainers etc).
- Search for licenses files in the tarball and return the [SPDX](https://spdx.org/licenses/) expression conformance of each detected licenses.
- Link vulnerabilities from the multiple sources like GitHub Advisory, Sonatype or Snyk using [Vulnera](https://github.com/NodeSecure/vulnera). 
- Add flags (emojis) to each packages versions to identify well known patterns and potential security threats easily.
- First-class support of open source security initiatives like [OpenSSF Scorecard](https://github.com/ossf/scorecard).
- Generate security report (PDF).

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) v24 or higher

## 💃 Getting Started

```bash
$ npm install @nodesecure/cli -g
```

or, from source (this package lives in the [NodeSecure/cli](https://github.com/NodeSecure/cli) monorepo):

```bash
$ git clone https://github.com/NodeSecure/cli.git
$ cd cli

$ npm install
# bundle/compile front-end assets for every workspace
$ npm run build

$ cd workspaces/cli
$ npm link
```

Then the **nsecure** binary will be available in your terminal. Give a try with the popular [express](http://expressjs.com/) package. This will automatically open the webpage in your default system browser.
```bash
$ nsecure auto express
```

> [!TIP]
> Setup an [npm token](https://github.com/NodeSecure/cli#private-packages--registry) to avoid hiting the maximum request limit of the npm registry API.

## 👀 Usage example

```bash
# Run a scan on the current working dir
# Note: must have a package.json or node_modules directory
$ nsecure cwd

# Run a scan on a remote 'npm' package
$ nsecure from mocha
```

Then a `nsecure-result.json` will be writted at the current CLI location. To open it on a web page just run

```bash
$ nsecure open
```

### Command Documentation

The CLI includes built-in documentation accessible with the --help option:
```bash
$ nsecure --help
$ nsecure <command> --help
```

For complete details on each command, refer to the following documents:

- [`cwd`](./docs/cli/cwd.md)
- [`from`](./docs/cli/from.md)
- [`auto`](./docs/cli/auto.md)
- [`open`](./docs/cli/open.md)
- [`verify`](./docs/cli/verify.md)
- [`summary`](./docs/cli/summary.md)
- [`scorecard`](./docs/cli/scorecard.md)
- [`report`](./docs/cli/report.md)
- [`lang`](./docs/cli/lang.md)
- [`config create`](./docs/cli/config.md)
- [`config`](./docs/cli/config.md)
- [`cache`](./docs/cli/cache.md)
- [`extract integrity`](./docs/cli/extract-integrity.md)
- [`stats`](./docs/cli/stats.md)
- [re-highlight](./docs/cli/re-highlight.md)

Each link provides access to the full documentation for the command, including additional details, options, and usage examples.

## Private registry / Verdaccio

NodeSecure allow you to fetch stats on private npm packages by setting up a `NODE_SECURE_TOKEN` env variable (which must contains an [npm token](https://docs.npmjs.com/creating-and-viewing-authentication-tokens)).

> [!TIP]
> If you `npm link` the package by yourself you can create a `.env` file at the root of the project too.

NodeSecure is capable to work behind a custom private npm registry too by searching the default registry URL in your local npm configuration.

```bash
$ npm config get registry
$ npm config set registry "http://your-registry/"
```

## API
Our back-end scanner package is available [here](https://github.com/NodeSecure/scanner).

## Flags legends

Flags and emojis legends are documented [here](https://github.com/NodeSecure/flags/blob/main/FLAGS.md).

## Search command

Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) from the network view to open the search command. It lets you filter the dependency graph using one or more criteria simultaneously.

Type a package name directly to search, or prefix with a filter name followed by `:` to use a specific filter:

- `package` — **default when no prefix is given**, matches by name.
- `version` — semver range (e.g. `>=1.2.0`, `^2.0.0`).
- `flag` — select from the list of flags present in the current tree.
- `license` — SPDX identifier (e.g. `MIT`, `Apache-2.0`).
- `author` — author name or email.
- `ext` — file extension present in the package (e.g. `.js`, `.ts`).
- `builtin` — Node.js core module used by the package (e.g. `fs`, `path`).
- `size` — size range (see [size-satisfies](https://github.com/NodeSecure/size-satisfies#usage-example), e.g. `>50kb`, `10kb..200kb`).
- `highlighted` — all highlighted packages by default.

## FAQ

### Why some nodes are red in the UI ?
Nodes are highlighted in red when the project/package is flagged with 🔬 `hasMinifiedCode` or ⚠️ `hasWarnings`. You can deactivate specific warnings in the options if desired.

### Why the package size is so different from Bundlephobia ?
The back-end scanner will analyze the complete size of the npm tarball without any filters or specific optimizations. In contrast, Bundlephobia will bundle the package and remove most of the unnecessary files from the tarball, such as documentation and other non-essential items.

### Why some packages don't have OSSF Scorecard ?
See [Scorecard Public Data](https://github.com/ossf/scorecard#public-data):

> [!NOTE]
> We run a weekly Scorecard scan of the 1 million most critical open source projects judged by their direct dependencies and publish the results in a BigQuery public dataset.

## License
MIT
