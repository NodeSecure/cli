## 📝 Command `report`

The `report` command generates a detailed security report for a repository in PDF format (using [@nodesecure/report](https://github.com/NodeSecure/report)). The report can include all dependencies and can be customized with various options.

<p align="center">
<img src="https://camo.githubusercontent.com/a0611e28412fccf7ebc63b0f2ffca18055c04c3d144f4da98d149d064f59674b/68747470733a2f2f692e696d6775722e636f6d2f4a6872373645662e6a7067">
</p>


## 📜 Syntax

```bash
$ nsecure report [repository]
```

## ⚙️ Available Options

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--theme` | `-t` | `white` | Specify the theme for the report. |
| `--includesAllDeps` | `-i` | `true` | Include all dependencies in the report. |
| `--title` | `-l` | `NodeSecure Report` | Specify the title of the report. |
| `--reporters` | `-r` | `["html"]` | Specify the format of the report (e.g., HTML, JSON). |

