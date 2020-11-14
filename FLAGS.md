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

<details><summary>🐲 hasNativeCode</summary>
<br />

The package use native components (package, file, configuration) like **binding.gyp** or npm package for native addon like `node-addon-api`.

The flag is set to true if:
- One of the package file has an extension like `.c`, `.cpp`, `.gyp` (etc..)
- One of the package dependency is known for building native addons (or anything else).
- The package.json file has the property "gypfile" set to `true`.
</details>

<details><summary>⚠️ hasWarnings</summary>
<br />

This means that the [SAST](https://www.gartner.com/en/information-technology/glossary/static-application-security-testing-sast) Scanner has detected several problems by analyzing the Abstract Syntax Tree (AST) of a JavaScript source code. All warnings are accurately documented [here](https://github.com/fraxken/js-x-ray#warnings-legends-v20).

</details>

<details><summary>⛔️ isDeprecated</summary>
<br />

The given npm package has been deprecated by his author (it must be updated or replaced with an equivalent if there is no new version available).

For more information on deprecation please check the official [npm documentation](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions).
</details>

<details><summary>📜 hasNoLicense</summary>
<br />

This flag mean that we have not detected any licenses in the npm Tarball (or something went wrong in the detection) For detecting licenses we are reading the **package.json** and searching for local files that contain the word "license".

For more information on how license must be described in the package.json, please check the [npm documentation](https://docs.npmjs.com/files/package.json#license).

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

Some files may be considered as "minified" if they contains only short identifiers (there is a warning for this). A good example of code considered as minified because all identifiers are under 1.5 of length in average: [code](https://badjs.org/posts/smith-and-wesson-skimmer/#heading-modrrnize.js).

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
- child_process

> ⚠️ This flag only work if the AST analysis as successfully retrieved all dependencies as expected.

</details>

<details><summary>📦 hasScript</summary>
<br />

The package has pre and/or post script in the **package.json** file. These script will be executed before or after the installation of a dependency (this is useful for example to build native addons or similar things). However these script may be used to execute malicious code on your system.

Exemple:
```json
{
    "scripts": {
        "preinstall": "./maliciousScript.js"
    }
}
```

- [Package install scripts vulnerability](https://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability)
- [10 npm Security Best Practices](https://snyk.io/blog/ten-npm-security-best-practices/)
</details>

<details><summary>👥 hasManyPublishers</summary>
<br />

The package has been published on npm by multiple unique users. There is no big deal here, just mean the package is maintained by a group of people.
</details>

<details><summary>🚨 vulnerabilities</summary>
<br />

Vulnerabilities has been detected for the given package **version**. We are fetching vulnerabilities from the official [Node.js Security-WG repository](https://github.com/nodejs/security-wg)
</details>

<details><summary>👀 hasMissingOrUnusedDependency</summary>
<br />

The package has a missing dependency (in package.json) or a dependency that is not used in the code (this may happen if the AST Analysis fail!).

> However stay alert with this flag.. There is a lot of patterns for requiring dependencies that we fail to get right (IOC etc).

</details>

<details><summary>💀 isDead (hasReceivedUpdateInOneYear + hasOutdatedDependency)</summary>
<br />

The dependency (package) has not received update from at least one year and has at least one dependency that need to be updated. It probably
means it's dangerous to use (or continue to) because the author doesn't seem to update the package anymore (even worst if you want him to implement a new version / security patch).
</details>

<details><summary>⚔️ hasBannedFile</summary>
<br />

The project has at least one sensitive file (or a file with sensitive information in it). A sensitive file can be detected by its complete name or by its extension.

- .npmrc
- .env
- file with **.key** or **.pem** extensions

</details>

<details><summary>⌚️ isOutdated</summary>
<br />

The current package version is not equal to the latest version of the package (that we fetch on the npm registry). It can also mean that the package uses a tag such as:

- alpha
- beta
- next
- etc..

</details>

<details><summary>🎭 duplicate</summary>
<br />

Indicate that the package is already somewhere else in the dependency tree with a different version.

<img src="https://res.cloudinary.com/practicaldev/image/fetch/s--CGzN_Iw6--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://i.imgur.com/70ynftT.png">
</details>

## Notes
In the JSON payload some flags are linked to a given package version while other are linked to the package in general. For example **hasManyPublishers** and **hasChangedAuthor** are package flags.

## Add a new flag

The purpose of this section is to describe the addition of a flag to the Node-secure project. This could be useful in order to maintain and evolve the project without having to review the entire code.

### Back-end

Most of the time the flags start their lives within the file `src/dependency.class.js`. You just need to add the new flag in the private property `#flags` and add a new pair of getter/setter for it (Only if there is a need to update the flag before export).

Sometimes the flags are updated after the export via the functions **processPackageTarball** and **searchPackageAuthors**. In this case, you just have to complete the exported object from the Dependency class.

Adding a new flag means changing the returned payload in the API.. That's why we're also going to have to update the `index.d.ts`, TypeScript **Flags** interface which contains all the flags.

### Documentation

The new flag must be added and properly documented in the following files:

- FLAGS.md
- flags/manifest.json

> ⚠️ Adding the flag in the manifest file is an important step for the front-end.

### Front-end

A new HTML file must be created in the **flags** directory with the name of the flag. It will be used to document the flag in the UI (in the emojis legends popup).

Then update the **getFlags** method in the file `public/js/master.js` to add your own flag with the right emoji.
