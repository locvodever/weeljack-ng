import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjDock, WjDockItemSlot, type WjDockPosition } from 'weeljack-ng/dock';

@Component({
  selector: 'docs-dock-positions-example',
  imports: [WjDock, WjDockItemSlot],
  template: `
    @for (stage of stages; track stage.position) {
      <div class="stage">
        <p class="caption">{{ stage.caption }}</p>
        <wj-dock [model]="items" [position]="stage.position" [ariaLabel]="stage.name">
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
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 16px;
      inline-size: 100%;
    }

    .stage {
      position: relative;
      block-size: 16rem;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      background: var(--wj-content-hover-background);
      color: var(--wj-text-color);
    }

    .caption {
      position: absolute;
      inset: 50% 0 auto;
      margin: 0;
      transform: translateY(-50%);
      text-align: center;
      font-size: 0.875rem;
      color: var(--wj-text-color);
    }
  `,
})
export class DockPositionsExample {
  private readonly home: WjMenuItem = { label: 'Home' };
  private readonly search: WjMenuItem = { label: 'Search' };
  private readonly settings: WjMenuItem = { label: 'Settings' };
  protected readonly items: WjMenuItem[] = [this.home, this.search, this.settings];

  /** Each dock on a page needs a name of its own: the position tells them apart. */
  protected readonly stages: { position: WjDockPosition; caption: string; name: string }[] = [
    { position: 'top', caption: 'Top', name: 'Apps (top)' },
    { position: 'bottom', caption: 'Bottom', name: 'Apps (bottom)' },
    { position: 'left', caption: 'Left', name: 'Apps (left)' },
    { position: 'right', caption: 'Right', name: 'Apps (right)' },
  ];

  protected readonly icons = new Map<WjMenuItem, string>([
    [this.home, 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
    [this.search, 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3'],
    [
      this.settings,
      'M4 7h8M16 7h4M4 17h4M12 17h8M14 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM10 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    ],
  ]);
}
