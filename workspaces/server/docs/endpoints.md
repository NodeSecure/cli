# HTTP API Endpoints

The server exposes the following REST API endpoints. Static files (UI, assets) are served from `projectRootDir/dist` via [sirv](https://github.com/lukeed/sirv) and take precedence over the API routes.

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/` | Render the main HTML UI |
| `GET` | `/data` | Current analysis payload |
| `GET` | `/config` | Fetch server configuration |
| `PUT` | `/config` | Update server configuration |
| `GET` | `/i18n` | UI translations |
| `GET` | `/search/:packageName` | Search npm packages by name |
| `GET` | `/search-versions/:packageName` | List all versions of a package |
| `GET` | `/flags` | List all NodeSecure flags |
| `GET` | `/flags/description/:title` | HTML description for a flag |
| `GET` | `/bundle/:packageName` | Bundle size from Bundlephobia |
| `GET` | `/bundle/:packageName/:version` | Bundle size for a specific version |
| `GET` | `/downloads/:packageName` | npm download statistics |
| `GET` | `/scorecard/:org/:packageName` | OSSF Scorecard results |
| `POST` | `/report` | Generate a PDF report |

---

## `GET /`

Renders and returns the main HTML page for the NodeSecure UI.

| Status | Description |
| ------ | ----------- |
| 200 | HTML page |
| 500 | Rendering error |

---

## `GET /data`

Returns the current analysis payload from the cache.

| Status | Description |
| ------ | ----------- |
| 200 | JSON analysis payload |
| 204 | Cache is empty or no current spec is set |
| 404 | Current spec not found in cache |

---

## `GET /config`

Fetches the current web UI configuration.

| Status | Description |
| ------ | ----------- |
| 200 | JSON configuration object |

**Response shape:**
```json
{
  "defaultPackageMenu": "info",
  "ignore": {
    "flags": [],
    "warnings": ["experimental-feature"]
  },
  "theme": "light",
  "disableExternalRequests": false
}
```

---

## `PUT /config`

Updates and persists the web UI configuration.

**Request body:** A `WebUISettings` JSON object.

```json
{
  "defaultPackageMenu": "info",
  "ignore": {
    "flags": [],
    "warnings": []
  },
  "theme": "dark",
  "disableExternalRequests": false
}
```

| Status | Description |
| ------ | ----------- |
| 204 | Configuration saved successfully |

---

## `GET /i18n`

Returns UI translation strings for all supported languages.

| Status | Description |
| ------ | ----------- |
| 200 | JSON object with `english` and `french` translation maps |

---

## `GET /search/:packageName`

Searches the npm registry for packages matching the given name.

| Param | Description |
| ----- | ----------- |
| `packageName` | Name or partial name to search (URI-encoded) |

| Status | Description |
| ------ | ----------- |
| 200 | Search results |

**Response shape:**
```json
{
  "count": 5,
  "result": [
    { "name": "express", "version": "4.18.2", "description": "Fast web framework" }
  ]
}
```

---

## `GET /search-versions/:packageName`

Returns all published versions for a given npm package.

| Param | Description |
| ----- | ----------- |
| `packageName` | The npm package name (URI-encoded) |

| Status | Description |
| ------ | ----------- |
| 200 | Array of version strings, e.g. `["1.0.0", "1.1.0", "2.0.0"]` |

---

## `GET /flags`

Returns the manifest of all NodeSecure analysis flags and their metadata.

| Status | Description |
| ------ | ----------- |
| 200 | JSON flag manifest |

---

## `GET /flags/description/:title`

Streams the HTML description for a specific flag.

| Param | Description |
| ----- | ----------- |
| `title` | Flag name (e.g. `hasDuplicate`, `isDeprecated`) |

| Status | Description |
| ------ | ----------- |
| 200 | HTML stream for the flag description |
| 404 | Unknown flag title |

---

## `GET /bundle/:packageName`

Fetches bundle size information for the latest version of a package from [Bundlephobia](https://bundlephobia.com).

| Param | Description |
| ----- | ----------- |
| `packageName` | The npm package name (use `%2F` for scoped packages, e.g. `@scope%2Fpkg`) |

| Status | Description |
| ------ | ----------- |
| 200 | Bundle size data |

**Response shape:**
```json
{
  "gzip": 12345,
  "size": 45678,
  "dependencySizes": [
    { "name": "dep-name", "approximateSize": 1234 }
  ]
}
```

---

## `GET /bundle/:packageName/:version`

Same as above but for a specific version.

| Param | Description |
| ----- | ----------- |
| `packageName` | The npm package name |
| `version` | The package version |

---

## `GET /downloads/:packageName`

Fetches npm download statistics for the **last week** for a given package.

| Param | Description |
| ----- | ----------- |
| `packageName` | The npm package name (URI-encoded) |

| Status | Description |
| ------ | ----------- |
| 200 | Download statistics from the npm registry |

---

## `GET /scorecard/:org/:packageName`

Fetches [OSSF Scorecard](https://securityscorecards.dev) results for a package repository.

| Param | Description |
| ----- | ----------- |
| `org` | The GitHub organization or user |
| `packageName` | The repository name |

| Query | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| `platform` | `string` | `github.com` | Source platform |

> If a `GITHUB_TOKEN` environment variable is set, it will be used to resolve the scorecard.

| Status | Description |
| ------ | ----------- |
| 200 | `{ "data": <scorecard result> }` |

---

## `POST /report`

Generates a PDF report for the current analysis.

**Request body:**

| Field | Type | Description |
| ----- | ---- | ----------- |
| `title` | `string` | Report title |
| `includesAllDeps` | `boolean` | Include all dependencies or only the root |
| `theme` | `"light" \| "dark"` | Report theme |

| Status | Description |
| ------ | ----------- |
| 200 | PDF binary data |
| 404 | No current payload available |
