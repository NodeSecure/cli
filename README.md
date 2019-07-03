# node-secure
Node.js security CLI. The goal of the project is to a design a CLI that will allow to fetch all dependencies of a given package (or the package at the current working dir if there is a package.json to read) and draw a Network of all dependencies in a webpage.

- [Google Drive Documentation](https://docs.google.com/document/d/1853Uwup9mityAYqAOnen1KSqSA6hlBgpKU0u0ygGY4Y/edit?usp=sharing)

## Requirements
- [Node.js](https://nodejs.org/en/) version 12 or higher

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
