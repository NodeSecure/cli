# 🚀 Command `auto`

The `auto` command combines the `cwd` and `from` commands to analyze and explore a local project or remote NPM packages in the WebUI.

## 📜 Syntax

```bash
$ nsecure auto [spec]
```

Omitting the `[spec]` option is equivalent to running the `cwd` and `open` commands together. If `[spec]` is provided, the `from` command will be used instead.

## 👀 Example

By default, when using the `auto` command, the JSON payload is deleted once the HTTP server is closed. If you want to keep the JSON file to share or re-open it later, simply add the `--keep` or `-k` option.

```bash
$ nsecure auto --keep
```

## ⚙️ Available Options

| Name                      | Shortcut | Default Value    | Description                                                                                                                                                     |
| ------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--depth`                 | `-d`     | `Infinity`       | Maximum tree depth to scan.                                                                                                                                     |
| `--silent`                |          | `false`          | Suppress console output, making execution silent.                                                                                                               |
| `--output`                | `-o`     | `nsecure-result` | Specify the output file for the results.                                                                                                                        |
| `--vulnerabilityStrategy` | `-s`     | github-advisory  | Strategy used to fetch package vulnerabilities (see Vulnera [available strategy](https://github.com/NodeSecure/vulnera?tab=readme-ov-file#available-strategy)). |
| `--keep`                  | `-k`     | `false`          | Preserve JSON payload after execution.                                                                                                                          |
| `--developer`             | `-d`     | `false`          | Launch the server in developer mode, enabling automatic HTML component refresh.                                                                                 |
| `--contacts`              | `-c`     | `'[]'`           | List of contacts to highlight.                                                                                                                                  |
