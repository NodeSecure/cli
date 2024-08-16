## 📝 Command `report`

The `report` command is used to generate a detailed security report for a repository. This report can include all dependencies and be customized with various options such as theme, title, and format.

## 📜 Syntax

```bash
nsecure report [repository]
```

## ⚙️ Available Options

| **Name**            | **Shortcut** | **Default Value**         | **Description**                                          |
|---------------------|--------------|---------------------------|----------------------------------------------------------|
| `--theme`           | `-t`         | `white`                   | Specify the theme for the report.                        |
| `--includesAllDeps` | `-i`         | `true`                    | Include all dependencies in the report.                  |
| `--title`           | `-l`         | `NodeSecure Report`       | Specify the title of the report.                         |
| `--reporters`       | `-r`         | `["html"]`                | Specify the format of the report (e.g., HTML, JSON).     |

