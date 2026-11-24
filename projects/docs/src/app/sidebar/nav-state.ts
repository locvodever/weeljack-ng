import { Location } from '@angular/common';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { DocsShellData } from './nav-data';

/** The sidebar group ids a router URL belongs to; empty for a page the sidebar does not list. */
function groupsOf(url: string, groupOfEntry: ReadonlyMap<string, string>): string[] {
  const path = url.split(/[?#]/, 1)[0] ?? '';
  const [first, second] = path.split('/').filter(Boolean);
  switch (first) {
    case undefined:
    case 'getting-started':
    case 'platform-support':
      return ['getting-started'];
    case 'guides':
      return ['guides'];
    case 'components': {
      const sub = second === undefined ? undefined : groupOfEntry.get(second);
      return sub === undefined ? ['components'] : ['components', sub];
    }
    case 'errors':
    case 'changelog':
      return ['reference'];
    default:
      return [];
  }
}

/**
 * Which sidebar groups are open. A page's groups open when it is reached and stay open until the
 * reader closes them, so a navigation only ever adds. Pure state with no browser globals: the
 * server runs it too, which is what puts the right group open in the prerendered HTML.
 */
@Injectable({ providedIn: 'root' })
export class DocsNavState {
  private readonly open = signal<ReadonlySet<string>>(new Set());

  private readonly shell = inject(DocsShellData);

  /** The component sub-group (catalog id) each shipped entry sits in; empty until the data is. */
  private readonly groupOfEntry = computed<ReadonlyMap<string, string>>(
    () =>
      new Map(
        this.shell
          .groups()
          .flatMap((group) => group.links.map((link) => [link.entry, group.id] as const)),
      ),
  );

  private lastUrl: string;

  constructor() {
    // Before the first navigation ends the router still reads "/", so seed from the address.
    this.lastUrl = inject(Location).path();
    this.reveal(this.lastUrl);
    // Data that arrives late (a client-rendered page) re-applies the last reveal.
    effect(() => {
      this.groupOfEntry();
      untracked(() => {
        this.reveal(this.lastUrl);
      });
    });
  }

  isOpen(id: string): boolean {
    return this.open().has(id);
  }

  toggle(id: string): void {
    this.open.update((open) => {
      const next = new Set(open);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** Opens the groups holding `url` (query and fragment ignored). Never closes one. */
  reveal(url: string): void {
    this.lastUrl = url;
    const ids = groupsOf(url, this.groupOfEntry());
    if (ids.some((id) => !this.open().has(id))) {
      this.open.update((open) => new Set([...open, ...ids]));
    }
  }
}
