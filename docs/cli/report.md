## 📝 Command `report`

The `report` command generates a detailed security report for a repository in PDF format. The report can include all dependencies and can be customized with various options.

## 📜 Syntax

```bash
nsecure report [repository]
```

## ⚙️ Available Options

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--theme` | `-t` | `white` | Specify the theme for the report. |
| `--includesAllDeps` | `-i` | `true` | Include all dependencies in the report. |
| `--title` | `-l` | `NodeSecure Report` | Specify the title of the report. |
| `--reporters` | `-r` | `["html"]` | Specify the format of the report (e.g., HTML, JSON). |

