# 📂 Command `cwd`

The `cwd` command scans the project in the current working directory using the `package.json` and `package-lock.json` files, and stores the analysis results in a JSON file. You can then share this JSON or explore it in the WebUI using the `open` command.

## 📜 Syntax

```bash
nsecure cwd [options]
```

## ⚙️ Available Options

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--nolock` | `-n` | `false` | Do not use a lock file (package-lock.json or yarn.lock) for the analysis. |
| `--full` | `-f` | `false` | Perform a full analysis of the project, including all dependencies. |
| `--depth` | `-d` | `4` | Specify the depth of dependency analysis. |
| `--silent` |   |   | Suppress console output, making execution silent. |
| `--output` | `-o` | `nsecure-result` | Specify the output file for the results. |
