# 📦 Command `from`

The `from` command allows you to run a security analysis on a specific npm package, which must be available in the npm registry. This command is useful for evaluating the security of a package before including it in your project.

## 📜 Syntax

```bash
$ nsecure from <spec> [options]
```

## 👀 Example

Scanning version 3.0.0 of express and saving the result into `./express-report.json`

```bash
$ nsecure from express@3.0.0 -o express-report
```

## ⚙️ Available Options

| Name                      | Shortcut | Default Value    | Description                                                                                                                                                     |
| ------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--depth`                 | `-d`     | `Infinity`       | Maximum tree depth to scan.                                                                                                                                     |
| `--silent`                |          | `false`          | Suppress console output, making execution silent.                                                                                                               |
| `--output`                | `-o`     | `nsecure-result` | Specify the output file for the results.                                                                                                                        |
| `--vulnerabilityStrategy` | `-s`     | github-advisory  | Strategy used to fetch package vulnerabilities (see Vulnera [available strategy](https://github.com/NodeSecure/vulnera?tab=readme-ov-file#available-strategy)). |
| `--contacts`              | `-c`     | `[]`           | List of contacts to highlight.                                                                                                                                  |
