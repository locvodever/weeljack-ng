import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import nav from '../../generated/nav.json';

/** The component sub-group (catalog id) each shipped entry sits in. */
const GROUP_OF_ENTRY: ReadonlyMap<string, string> = new Map(
  nav.groups.flatMap((group) => group.links.map((link) => [link.entry, group.id] as const)),
);

/** The sidebar group ids a router URL belongs to; empty for a page the sidebar does not list. */
function groupsOf(url: string): string[] {
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
      const sub = second === undefined ? undefined : GROUP_OF_ENTRY.get(second);
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

  constructor() {
    // Before the first navigation ends the router still reads "/", so seed from the address.
    this.reveal(inject(Location).path());
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
    const ids = groupsOf(url);
    if (ids.some((id) => !this.open().has(id))) {
      this.open.update((open) => new Set([...open, ...ids]));
    }
  }
}
