# ⚙️ Command `config`

The `config` command allows you to manage the configuration files used by NodeSecure. This command can be used to either create a new configuration file or edit an existing one.

## 📜 Syntax

```bash
nsecure config [sub-command] [options]
```

## 📝 Description

The `config` command is designed to help you manage your NodeSecure configuration files. With this command, you can create a new configuration file with the `create` sub-command, or edit an existing configuration file with the `edit` sub-command. This is useful for customizing the behavior of NodeSecure based on your specific needs.

## ⚙️ Available Options

### `create` Sub-command

| **Name** | **Shortcut** | **Default Value** | **Description**                                                               |
|----------|--------------|-------------------|-------------------------------------------------------------------------------|
| `--cwd`  | `-c`         | `false`           | Create the configuration file in the current working directory instead of the default location. |

### `edit` Sub-command

This sub-command does not have any specific options.

