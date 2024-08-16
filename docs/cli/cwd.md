# 📂 Command `cwd`

The `cwd` command allows you to scan the project located in the current working directory using the strategies defined by the tool. This command is useful for analyzing the security of a Node.js project by inspecting the dependencies installed locally in the current working directory.

## 📜 Syntax

```bash
nsecure cwd [options]
```

## ⚙️ Available Options

| **Name**    | **Shortcut** | **Default Value**   | **Description**                                                              |
|-------------|--------------|---------------------|------------------------------------------------------------------------------|
| `--nolock`  | `-n`         | `false`             | Do not use a lock file (package-lock.json or yarn.lock) for the analysis.     |
| `--full`    | `-f`         | `false`             | Perform a full analysis of the project, including all dependencies.           |
| `--depth`   | `-d`         | `4`                 | Specify the depth of dependency analysis.                                     |
| `--silent`  |              |                     | Suppress console output, making execution silent.                             |
| `--output`  | `-o`         | `nsecure-result`    | Specify the output file for the results.                                      |
