// Import Third-party Dependencies
import type { HLJSApi } from "highlight.js";

declare module "highlightjs-line-numbers.js";
declare module "highlightjs-line-numbers.js/dist/highlightjs-line-numbers.min.js";

// Import Internal Dependencies
import type { SettingsView } from "./components/views/settings/settings.js";
import type { ViewNavigation } from "./components/navigation/navigation.js";
import type { Wiki } from "./components/wiki/wiki.js";
import type { NetworkNavigation } from "./core/network-navigation.js";
import type { WebSocketClient } from "./websocket.js";
import type { SearchView } from "./components/views/search/search.js";
import type { TreeView } from "./components/views/tree/tree.js";
import type { WarningsView } from "./components/views/warnings/warnings.js";
import type { NetworkBreadcrumb } from "./components/network-breadcrumb/network-breadcrumb.js";
import type { CommandPalette } from "./components/command-palette/command-palette.js";
import type { Files } from "./components/package/pannels/files/files.js";
import type { Licenses } from "./components/package/pannels/licenses/licenses.js";
import type { Vulnerabilities } from "./components/package/pannels/vulnerabilities/vulnerabilities.js";
import type { Scripts } from "./components/package/pannels/scripts/scripts.js";
import type { Locker } from "./components/locker/locker.js";
import type { NpmAvatar } from "./components/npm-avatar/npm-avatar.js";
import type { Maintainers, PopupMaintainer } from "./components/views/home/maintainers/maintainers.js";
import type { PopupReport } from "./components/views/home/report/report.js";
import type { FileBox } from "./components/file-box/file-box.js";
import type { Gauge } from "./components/gauge/gauge.js";
import type { Expandable } from "./components/expandable/expandable.js";

declare global {
  interface HTMLElementTagNameMap {
    "search-view": SearchView;
    "tree-view": TreeView;
    "warnings-view": WarningsView;
    "settings-view": SettingsView;
    "network-breadcrumb": NetworkBreadcrumb;
    "command-palette": CommandPalette;
    "package-files": Files;
    "package-licenses": Licenses;
    "package-vulnerabilities": Vulnerabilities;
    "package-scripts": Scripts;
    "nsecure-locker": Locker;
    "npm-avatar": NpmAvatar;
    "nsecure-maintainers": Maintainers;
    "popup-maintainer": PopupMaintainer;
    "file-box": FileBox;
    "gauge-bar": Gauge;
    "expandable-span": Expandable;
    "popup-report": PopupReport;
  }

  interface Window {
    /**
     * Cached package specifications received from the server (e.g. `"express@4.18.0"`).
     * Populated on the `INIT` / `RELOAD` WebSocket events.
     */
    cachedSpecs: import("./types.js").CachedSpec[];

    /**
     * The `<nsecure-locker>` custom element placed in the network view.
     * `null` until the network dataset is first loaded.
     */
    locker: Locker | null;

    /**
     * Application settings instance, hydrated from the `/config` endpoint.
     * Contains the active theme, ignored warnings/flags, and other UI preferences.
     */
    settings: SettingsView;

    /**
     * Localisation dictionary fetched from `/i18n`.
     * Indexed as `window.i18n[lang][section][key]`.
     */
    i18n: Record<string, Record<string, Record<string, string>>>;

    /**
     * Controls which top-level view (network / home / settings / search) is active.
     */
    navigation: ViewNavigation;

    /**
     * The slide-in documentation / wiki panel controller.
     */
    wiki: Wiki;

    /**
     * The currently active package displayed in the network graph, in `"name@version"` format.
     */
    activePackage: string;

    /**
     * Vulnerability strategy identifier coming from the loaded `NodeSecureDataSet`
     * (e.g. `"npm"`, `"sonatype"`, …).
     */
    vulnerabilityStrategy: string;

    /**
     * Keyboard / arrow-key navigation controller for the dependency network graph.
     */
    networkNav: NetworkNavigation;

    /**
     * The `<nsecure-legend>` custom element rendered in the network view.
     * Exposes `show()` / `hide()` helpers and the reactive `isVisible` property.
     */
    legend: HTMLElement & { isVisible: boolean; show(): void; hide(): void };

    /**
     * WebSocket client used to communicate with the local nsecure server.
     * Assigned during app startup; dispatches typed `CustomEvent`s via `EventTarget`.
     */
    socket: WebSocketClient;

    /**
     * The currently expanded `<expandable-span>` legend element.
     * `null` when no legend item is open.
     */
    activeLegendElement: HTMLElement | null;

    /**
     * The `highlight.js` core instance, exposed globally for the inline code-fetcher widget.
     * The `highlightjs-line-numbers` plugin attaches `initLineNumbersOnLoad` at runtime.
     */
    hljs: HLJSApi & { initLineNumbersOnLoad(): void };

    /**
     * WebSocket server port, injected server-side into `views/index.html`.
     */
    __WS_PORT__: number;
  }
}

export {};
