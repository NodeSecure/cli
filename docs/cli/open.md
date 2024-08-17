## 📝 Command `open`

The `open` command reads a specified JSON payload and starts a local HTTP server. This allows you to explore dependencies, their metrics, and potential threats directly in your web browser.

## 📜 Syntax

```bash
nsecure open [json]
```

>[!NOTE]
> If the `[json]` property is omitted, the command will default to searching for a `nsecure-result.json` file in the current working directory.
> 
## ⚙️ Available Options

| Name | Shortcut | Default Value | Description |
|---|---|---|---|
| `--port` | `-p` | `process.env.PORT` | Specify the port on which the HTTP server should run. |

