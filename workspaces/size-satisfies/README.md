# `size-satisfies`

[![version](https://img.shields.io/github/package-json/v/NodeSecure/Cli?filename=workspaces%2Fsize-satisfies%2Fpackage.json&style=for-the-badge)](https://www.npmjs.com/package/@nodesecure/size-satisfies)
[![OpenSSF
Scorecard](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli/badge?style=for-the-badge)](https://api.securityscorecards.dev/projects/github.com/NodeSecure/cli)
[![mit](https://img.shields.io/github/license/NodeSecure/Cli?style=for-the-badge)](https://github.com/NodeSecure/cli/blob/master/workspaces/size-satisfies/LICENSE)
![size](https://img.shields.io/github/languages/code-size/NodeSecure/size-satisfies?style=for-the-badge)
[![build](https://img.shields.io/github/actions/workflow/status/NodeSecure/cli/size-satisfies.yml?style=for-the-badge)](https://github.com/NodeSecure/cli/actions?query=workflow%3A%22Size+Satisfies+CI%22)

Check whether a file size satisfies a given constraint — like `semver.satisfies` but for bytes.

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
import sizeSatisfies from "@nodesecure/size-satisfies";

// String sizes are parsed using the `bytes` package (B, KB, MB, GB, …)
console.log(sizeSatisfies(">= 45KB", "20MB")); // true  — 20 MB is >= 45 KB
console.log(sizeSatisfies("<= 45KB", "10B"));  // true  — 10 B is <= 45 KB
console.log(sizeSatisfies("= 1MB", "1MB"));    // true  — exact match
console.log(sizeSatisfies("> 45KB", "45KB"));  // false — not strictly greater

// Numeric sizes are treated as bytes
console.log(sizeSatisfies(">= 45KB", 46080));  // true  — 46 080 B == 45 KB
console.log(sizeSatisfies("= 45KB", 2000));    // false — 2 000 B != 45 KB
console.log(sizeSatisfies("< 45KB", 0));       // true  — 0 B < 45 KB

// Invalid patterns always return false
console.log(sizeSatisfies("", "45KB"));        // false — empty pattern
console.log(sizeSatisfies("45KB", "45KB"));    // false — missing operator
console.log(sizeSatisfies("!! 45KB", "45KB")); // false — unknown operator

// Unparseable sizes fall back to 0
console.log(sizeSatisfies("> 0KB", "not_a_size"));   // false — 0 > 0 is false
console.log(sizeSatisfies("= 0KB", "not_a_size"));   // true  — 0 == 0
console.log(sizeSatisfies(">= not_a_size", "10KB")); // true  — 10 KB >= 0
```

## API

### `sizeSatisfies(pattern, size)`

```ts
function sizeSatisfies(pattern: string, size: number | string): boolean
```

Returns `true` when `size` satisfies the constraint expressed by `pattern`, `false` otherwise.

#### `pattern`

A string composed of an **operator** followed by a **size value** (with an optional space between them):

```
">= 45KB"
"<  1MB"
"=  512B"
```

| Operator | Meaning                  |
|----------|--------------------------|
| `>=`     | greater than or equal to |
| `<=`     | less than or equal to    |
| `>`      | strictly greater than    |
| `<`      | strictly less than       |
| `=`      | exactly equal to         |

The size value in the pattern is parsed by the [`bytes`](https://www.npmjs.com/package/bytes) package and therefore supports the same units: `B`, `KB`, `MB`, `GB`, `TB`, `PB` (case-insensitive). An unparseable size value falls back to `0`.

A pattern that is empty, has no operator, or uses an unrecognised operator causes the function to return `false` immediately.

#### `size`

The actual size to test against the pattern.

- **`number`** — interpreted as a raw byte count.
- **`string`** — parsed by the [`bytes`](https://www.npmjs.com/package/bytes) package (e.g. `"45KB"`, `"1.5MB"`). An unparseable string falls back to `0`.

## License

MIT
