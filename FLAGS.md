# Flags

## Why emojis for flags ?
Because it allows to convey a message while remaining compatible and simple to setup in a Web page.

## Legends

> 👀 click on the arrow to show the complete description

Each summaries title are the name of the flag in the JSON.

<details><summary>☁️ isGit</summary>
<br />

The project has been detected as a GIT repository. Sometimes a dependency on the package.json link to a GIT repository, example:

```json
{
    "dependencies": {
        "uNodeHttpServer": "git+https://github.com/tpoisseau/uNodeHttpServer.git#1.2.0"
    }
}
```

Because under the hood we use [pacote](https://github.com/npm/pacote#readme) to fetch and extract packages we are supporting this given pattern.
</details>

<details><summary>🌲 hasIndirectDependencies</summary>
<br />

The package has indirect (or also called transitive) dependencies. This means that the child dependencies of the package also have dependencies.

<img src="https://i.imgur.com/GQBUwbp.png" width="300">

In the following example **accepts** is flagged 🌲 because **mime-types** has a **mime-db** dependency which mean that the package is an indirect dependency of **accepts**.

Indirect dependencies are dangerous for many reasons and you may found useful informations in these articles / study:
- [78% of vulnerabilities are found in indirect dependencies, making remediation complex](https://snyk.io/blog/78-of-vulnerabilities-are-found-in-indirect-dependencies-making-remediation-complex/)
- [Small World with High Risks: A Study of Security Threats in the npm Ecosystem](https://arxiv.org/pdf/1902.09217.pdf)
- [Angular vs React: the security risk of indirect dependencies](https://snyk.io/blog/angular-vs-react-the-security-risk-of-indirect-dependencies/)
</details>

<details><summary>⚠️ hasWarnings</summary>
<br />

This mean that the AST (Abstract Syntax Tree) analysis as emitted one or many warnings ! There is many different **kind** of warning:

- **unsafe-import** (Unable to parse/detect a dependency name)
- **unsafe-regex** (Unsafe regex)
- **ast-error** (An error as occured in the AST Analysis)

### Unsafe-import

Example if your package contains a .js file with the following content:

```js
const { readFileSync } = require("fs");
const { join } = require("path");
const myLib = require("./lib");
```

Then the AST analysis will return `fs`, `path` and `./lib` as required dependencies. The code will not be considered suspicious ! But if we take a malicious code:

```js
function unhex(r) {
   return Buffer.from(r, "hex").toString();
}

const g = Function("return this")();
const p = g["pro" + "cess"];

const evil = p["mainMod" + "ule"][unhex("72657175697265")];
evil(unhex("68747470")).request
```

This code require the core package `http` but the AST analysis is not capable to get it (not yet 😁). So the code will be flagged as "suspect".

### unsafe-regex

RegEx are dangerous and could lead to ReDos attack. This warning is emitted when the package [safe-regex](https://github.com/davisjam/safe-regex) return true.

- [How a RegEx can bring your Node.js service down](https://medium.com/@liran.tal/node-js-pitfalls-how-a-regex-can-bring-your-system-down-cbf1dc6c4e02)

### ast-error

The AST Analysis has failed (return the stack trace of nsecure). The JSON payload will contains an "error" field with the stack trace.

</details>

<details><summary>⛔️ isDeprecated</summary>
<br />

The given npm package has been deprecated by his author (it must be updated or replaced with an equivalent if there is no new version available).

For more information on deprecation please check the official [npm documentation](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions).
</details>

<details><summary>📜 hasLicense</summary>
<br />

This flag mean that we have not detected any licenses in the npm Tarball (or something went wrong in the detection) For detecting licenses we are reading the **package.json** and searching for local files that contain the word "license".

For more information on how license must be described in the package.json, please check the [npm documentation](https://docs.npmjs.com/files/package.json#license).

> ⚠️ we are working to stabilize this flag !

</details>

<details><summary>📚 hasMultipleLicenses</summary>
<br />

We have detected different licenses in **package.json** and other licenses files (**LICENSE**, **LICENSE.MD** etc). This probably means that there is an inconsistency in the choice of the license (or a file not updated yet with the right license).

This flag has not been created to detect multiple licenses / conformance rules. Example: `ISC OR GPL-2.0-with-GCC-exception`. Under the hood we use [conformance](https://github.com/cutenode/conformance#readme) to parse licenses !
</details>

<details><summary>🔬 hasMinifiedCode</summary>
<br />

Has one or many files that has been detected as minified JavaScript code. We use a package that will tell us if the code is minified (in case the file as a **.min** then we will consider the file minified by default).

Minified JavaScript code are commonly used by hacker to obfuscate the code to avoid being spotted. A good practice is surely to check all the packages with the flag.

Example of minified code:
```js
function cleanRange(version){const firstChar=version.charAt(0);if(firstChar==="^"||firstChar==="<"||firstChar===">"||firstChar==="="||firstChar==="~"){return version.slice(version.charAt(1)==="="?2:1)}
return version}
```

> ⚠️ sometimes one line file are considered minified (we are working to fix this in the future).
</details>

<details><summary>💎 hasCustomResolver</summary>
<br />

The package has custom dependencies resolver such as `+git` or `+ssh` or a local file with `file:`. Note that pacote doesn't support `ssh` so there is no support in nsecure for this kind of resolver.

Documentation: [npm-install](https://docs.npmjs.com/cli/install)
</details>

<details><summary>🌍 hasExternalCapacity</summary>
<br />

The package use a Node.js core package that allow to access the network. These core package are:
- http
- https
- net
- http2
- dgram

This flag only work if the AST analysis as successfully retrieved all dependencies as expected.

</details>

<details><summary>📦 hasScript</summary>
<br />

The package has pre and/or post script in the **package.json** file. These script will be executed before or after the installation of a dependency (this is useful for example to build native addons or similar things). However these script may be used to execute malicious code on your system.

- [Package install scripts vulnerability](https://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability)
- [10 npm Security Best Practices](https://snyk.io/blog/ten-npm-security-best-practices/)
</details>

<details><summary>💕 hasManyPublishers</summary>
<br />

The package has been published on npm by multiple unique users. There is no big deal here, just mean the package is maintained by a group of people.
</details>

<details><summary>👥 hasChangedAuthor</summary>
<br />

The package original author/owner has been updated. This may indicate ownership transfer !

> ⚠️ this flag is not yet as revelant as we want because sometimes we fail to retrieve the real package owner.
</details>

<details><summary>🚨 vulnerabilities</summary>
<br />

Vulnerabilities has been detected for the given package **version**. We are fetching vulnerabilities from the official [Node.js Security-WG repository](https://github.com/nodejs/security-wg)
</details>

<details><summary>👀 hasMissingOrUnusedDependency</summary>
<br />

The package has a missing dependency (in package.json) or a dependency that is not used in the code (this may happen if the AST Analysis fail!)
</details>

<details><summary>💀 isDead (hasReceivedUpdateInOneYear + hasOutdatedDependency)</summary>
<br />

The dependency (package) has not received update from at least one year and has at least one dependency that need to be updated. It probably
means it's dangerous to use (or continue to) because the author doesn't seem to update the package anymore (even worst if you want him to implement a new version / security patch).
</details>

## Web UI Emojis

Following emojis are only available in the node-secure UI:

<details><summary>🎭 duplicate</summary>
<br />

Indicate that the package is already somewhere else in the dependency tree with a different version.

<img src="https://res.cloudinary.com/practicaldev/image/fetch/s--CGzN_Iw6--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://i.imgur.com/70ynftT.png">
</details>

## Notes
In the JSON payload some flags are linked to a given package version while other are linked to the package in general. For example **hasManyPublishers** and **hasChangedAuthor** are package flags.
