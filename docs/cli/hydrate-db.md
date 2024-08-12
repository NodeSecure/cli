## 📝 Description

The `hydrate-db` command is used to hydrate the Node.js dependency database. It fetches the dependency tree and any associated vulnerabilities, storing the results in a specified output file. This command is essential for maintaining an up-to-date security report by analyzing the project's dependencies and their potential vulnerabilities.


```bash
nsecure hydrate-db
```

## ⚙️ Available Options

| **Name**                 | **Shortcut** | **Default Value**            | **Description**                                                      |
|--------------------------|--------------|------------------------------|----------------------------------------------------------------------|
| `--depth`                | `-d`         | `4`                          | The maximum depth to walk when fetching the whole tree.              |
| `--silent`               |              | `false`                      | Run the command in silent mode, suppressing output.                  |
| `--output`               | `-o`         | `nsecure-result`              | Specify the output file name.                                        |
| `--vulnerabilityStrategy`| `-s`         | `vulnera.strategies.GITHUB_ADVISORY` | Specify the vulnerability strategy to use.                           |
