import {
  Injectable,
  InjectionToken,
  TransferState,
  computed,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';

/** One entry's link in a component sub-group. */
export interface NavEntryLink {
  readonly entry: string;
  readonly title: string;
}

/** A component sub-group (a catalog wave group). */
export interface NavComponentGroup {
  readonly id: string;
  readonly label: string;
  readonly links: readonly NavEntryLink[];
}

/** What the shell needs at first paint beyond its own markup. */
export interface ShellData {
  readonly version: string;
  readonly groups: readonly NavComponentGroup[];
}

/** Provided by the server config only, from static imports that never reach the browser bundle. */
export const SHELL_DATA = new InjectionToken<ShellData>('SHELL_DATA');

const SHELL_KEY = makeStateKey<ShellData>('docs-shell');

/**
 * The version and the sidebar's component sub-groups. The server provides them (`SHELL_DATA`) and
 * writes them to `TransferState`, so the browser's first render equals the prerendered one. With
 * no transfer state (the client-rendered `404.html`) they load from their own lazy chunks.
 */
@Injectable({ providedIn: 'root' })
export class DocsShellData {
  private readonly data = signal<ShellData | null>(null);

  /** Empty until known. */
  readonly version = computed(() => this.data()?.version ?? '');
  readonly groups = computed(() => this.data()?.groups ?? []);

  constructor() {
    const transfer = inject(TransferState);
    const provided = inject(SHELL_DATA, { optional: true });
    if (provided !== null) {
      transfer.set(SHELL_KEY, provided);
      this.data.set(provided);
      return;
    }
    const transferred = transfer.get(SHELL_KEY, null);
    if (transferred === null) {
      void this.load();
    } else {
      this.data.set(transferred);
    }
  }

  private async load(): Promise<void> {
    const [{ default: nav }, { default: index }] = await Promise.all([
      import('../../generated/nav.json'),
      import('../../generated/api/index.json'),
    ]);
    this.data.set({ version: index.version, groups: nav.groups });
  }
}
