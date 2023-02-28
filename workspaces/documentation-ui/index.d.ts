declare class Header {
  active: HTMLElement;
  views: Map<string, HTMLElement>;
  defaultName: string | null;

  setNewActiveView(name: string): void;
}

declare class Navigation {
  active: HTMLElement;
  menus: Map<string, HTMLElement>;
  defaultName: string | null;
  prefetch: boolean;
  fetchCallback: (name: string, menu: HTMLElement) => any;

  setNewActiveMenu(name: string): void;
}

export interface RenderDocumentationUIOptions {
  /**
   * Prefetch all flags and cache them
   *
   * @default true
   */
  prefetch?: boolean;
}

export interface RenderResult {
  header: Header;
  navigation: {
    flags: Navigation;
    warnings: Navigation;
  }
}

export function render(rootElement: HTMLElement, options: RenderDocumentationUIOptions): RenderResult;
