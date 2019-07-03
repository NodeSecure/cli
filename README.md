# node-secure

[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]

Node.js security CLI. The goal of the project is to a design a CLI that will allow to fetch all dependencies of a given package (or the package at the current working dir if there is a package.json to read) and draw a Network of all dependencies in a webpage.

- [Google Drive Documentation](https://docs.google.com/document/d/1853Uwup9mityAYqAOnen1KSqSA6hlBgpKU0u0ygGY4Y/edit?usp=sharing)

## Requirements

- [Node.js](https://nodejs.org/en/) version 10 or higher

## Getting Started

```bash
$ git clone https://github.com/ES-Community/node-secure.git
$ cd node-secure
$ npm ci
$ npm link
```

## Usage example

```bash
$ nsecure mocha
# or
$ nsecure
```

> If no package is provided, it will try to read the package.json at the current working dir.

## License

MIT

[travis-image]: https://img.shields.io/travis/ES-Community/node-secure/master.svg?style=flat-square
[travis-url]: https://travis-ci.com/ES-Community/node-secure
[codecov-image]: https://img.shields.io/codecov/c/github/ES-Community/node-secure.svg?style=flat-square
[codecov-url]: https://codecov.io/github/ES-Community/node-secure
