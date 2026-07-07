// Import Third-party Dependencies
import type { HLJSApi } from "highlight.js";

// Import Internal Dependencies
import type { Settings } from "./components/views/settings/settings.js";
import type { ViewNavigation } from "./components/navigation/navigation.js";
import type { Wiki } from "./components/wiki/wiki.js";
import type { NetworkNavigation } from "./core/network-navigation.js";
import type { WebSocketClient } from "./websocket.js";

declare global {
  interface Window {
    /**
     * Cached package specifications received from the server (e.g. `"express@4.18.0"`).
     * Populated on the `INIT` / `RELOAD` WebSocket events.
     */
    cachedSpecs: string[];

    /**
     * The `<nsecure-locker>` custom element placed in the network view.
     * `null` until the network dataset is first loaded.
     */
    locker: (HTMLElement & { nsn: unknown }) | null;

    /**
     * Application settings instance, hydrated from the `/config` endpoint.
     * Contains the active theme, ignored warnings/flags, and other UI preferences.
     */
    settings: Settings;

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
  }
}

export {};
