## 📝 Command `cache`

The `cache` command allows you to manage NodeSecure cache, which is used for the packages navigation and the search page.

## 📜 Syntax

```bash
$ nsecure cache [options]
```

## ⚙️ Available Options

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--list` | `-l` | `false` | Display the cache contents in JSON format. Use with `--full` to include scanned payloads stored on disk. |
| `--clear` | `-c` | `false` | Remove cached entries. Use with `--full` to also delete scanned payloads stored on disk. |
| `--full` | `-f` | `false` | Extend the scope of `--list` or `--clear` to include scanned payloads stored on disk.|
