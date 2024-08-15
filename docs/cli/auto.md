# 🚀 Command `auto`

The `auto` command is designed to simplify and accelerate the security analysis of a project or package. By automatically combining the `cwd` and `from` commands, this tool allows you to quickly generate a comprehensive security report. Additionally, it can serve the results via an HTTP server for easy access and review.


```bash
nsecure auto [options]
```

## 📝 Description

The `auto` command is designed to simplify and accelerate the security analysis of a project or package. By automatically combining the `cwd` and `from` commands, this tool allows you to quickly generate a comprehensive security report. Additionally, it can serve the results via an HTTP server for easy access and review.

## ⚙️ Available Options

| **Name**   | **Shortcut** | **Default Value**   | **Description**                                                           |
|------------|--------------|---------------------|---------------------------------------------------------------------------|
| `--depth`  | `-d`         | `4`                 | Specify the depth of dependency analysis.                                  |
| `--silent` |              |                     | Suppress console output, making execution silent.                          |
| `--output` | `-o`         | `nsecure-result`    | Specify the output file for the results.                                   |
| `--keep`   | `-k`         | `false`             | Preserve temporary files after execution.                                  |
