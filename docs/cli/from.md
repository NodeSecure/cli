# 📦 Command `from`

The `from` command allows you to run a security analysis on a specific npm package, which must be available in the npm registry. This command is useful for evaluating the security of a package before including it in your project.

## 📜 Syntax

```bash
nsecure from <package> [options]
```

## ⚙️ Available Options

| **Name**    | **Shortcut** | **Default Value**   | **Description**                                                              |
|-------------|--------------|---------------------|------------------------------------------------------------------------------|
| `--depth`   | `-d`         | `4`                 | Specify the depth of dependency analysis.                                     |
| `--output`  | `-o`         | `nsecure-result`    | Specify the output file for the results.                                      |
| `--silent`  |              |                     | Suppress console output, making execution silent.                             |

