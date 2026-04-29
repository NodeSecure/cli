## 📝 Command `re-highlight`

The `re-highlight` command re-highlights the specified contacts and packages of the previous analysis stored in the JSON file at the root of this project.

## 📜 Syntax


```bash
$ nsecure re-highlight -c sindre sindre@gmail.com -c matteo -p lodash@^4.0.0 -p express@^4.18.0
```


## ⚙️ Available Options

| Name                      | Shortcut | Default Value    | Description                                                                                                                                                     |
| ------------------------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--output`                | `-o`     | `nsecure-result` | Specify the output file to read from.                                                                                                                        |
| `--contacts`              | `-c`     | `[]`           | List of contacts to highlight.                                                                                                      | 
| `--packages`              | `-p`     | `[]`           | List of packages to highlight.                                                                                                      | 
