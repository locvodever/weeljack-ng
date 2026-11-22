import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import nav from '../../generated/nav.json';
import { DocsNavState } from './nav-state';

interface NavLink {
  label: string;
  path: string;
}

interface NavGroup {
  id: string;
  label: string;
  links: NavLink[];
}

/** The fixed groups, in reading order. The component sub-groups come from `nav.json`. */
const GROUPS: readonly NavGroup[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    links: [
      { label: 'Introduction', path: '' },
      { label: 'Installation', path: 'getting-started' },
      { label: 'Platform support', path: 'platform-support' },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    links: [
      { label: 'Theming', path: 'guides/theming' },
      { label: 'Styling', path: 'guides/styling' },
      { label: 'From Optimus', path: 'guides/from-optimus' },
    ],
  },
  { id: 'components', label: 'Components', links: [{ label: 'Overview', path: 'components' }] },
  {
    id: 'reference',
    label: 'Reference',
    links: [
      { label: 'Errors', path: 'errors' },
      { label: 'Changelog', path: 'changelog' },
    ],
  },
];

/**
 * The documentation navigation: four groups, the Components one split into the catalog's wave
 * groups. Each header is a disclosure button; the page's own groups start open (`DocsNavState`).
 */
@Component({
  selector: 'docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: { '[class.sticky]': 'sticky()' },
})
export class DocsSidebar {
  /** Prefixes the list ids, so a second copy (the drawer) never repeats an id. */
  readonly idPrefix = input.required<string>();

  /** Sticks below the top bar and scrolls on its own; the drawer's copy turns this off. */
  readonly sticky = input(true);

  /** Emitted on every link click. */
  readonly linkClick = output();

  protected readonly state = inject(DocsNavState);

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly groups = GROUPS;
  protected readonly components = nav.groups;
}
