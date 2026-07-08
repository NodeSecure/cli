# ⚙️ Command `config`

The `config` command allows you to manage the `.nodesecurerc` configuration file, which is used by NodeSecure components to customize their behavior. You can use this command to create a new configuration file or edit the existing one.

## 📜 Syntax

```bash
$ nsecure config create [options]
# OR
$ nsecure config edit
```

## ⚙️ Available Options

### `create` Sub-command

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--cwd` | `-c` | `false` | Create the configuration file in the current working directory instead of the default location. |

### `edit` Sub-command

This sub-command does not have any specific options.
