import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjDock, WjDockItemSlot } from 'weeljack-ng/dock';

@Component({
  selector: 'docs-dock-basic-example',
  imports: [WjDock, WjDockItemSlot],
  template: `
    <div class="stage">
      <wj-dock [model]="items" ariaLabel="Apps">
        <ng-template wjDockItem let-item>
          <svg
            aria-hidden="true"
            focusable="false"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path [attr.d]="icons.get(item)" />
          </svg>
        </ng-template>
      </wj-dock>
    </div>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    /* Optimus positions the dock against the nearest positioned ancestor: this box. */
    .stage {
      position: relative;
      inline-size: 100%;
      block-size: 16rem;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      background: var(--wj-content-hover-background);
      color: var(--wj-text-color);
    }
  `,
})
export class DockBasicExample {
  private readonly home: WjMenuItem = { label: 'Home' };
  private readonly search: WjMenuItem = { label: 'Search' };
  private readonly mail: WjMenuItem = { label: 'Mail' };
  private readonly calendar: WjMenuItem = { label: 'Calendar' };
  private readonly settings: WjMenuItem = { label: 'Settings' };

  /** Every label is the tile's name and must be unique: it is never drawn. */
  protected readonly items: WjMenuItem[] = [
    this.home,
    this.search,
    this.mail,
    this.calendar,
    this.settings,
  ];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, string>([
    [this.home, 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
    [this.search, 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3'],
    [this.mail, 'M3 6h18v12H3zM3 7l9 6 9-6'],
    [this.calendar, 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'],
    [
      this.settings,
      'M4 7h8M16 7h4M4 17h4M12 17h8M14 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    ],
  ]);
}
