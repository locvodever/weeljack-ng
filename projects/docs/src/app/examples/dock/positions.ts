import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjDock, WjDockItemSlot, type WjDockPosition } from 'weeljack-ng/dock';
import {
  WjIcon,
  wjIconHouse,
  wjIconSearch,
  wjIconSettings,
  type WjIconDef,
} from 'weeljack-ng/icon';

@Component({
  selector: 'docs-dock-positions-example',
  imports: [WjDock, WjDockItemSlot, WjIcon],
  template: `
    @for (stage of stages; track stage.position) {
      <div class="stage">
        <p class="caption">{{ stage.caption }}</p>
        <wj-dock [model]="items" [position]="stage.position" [ariaLabel]="stage.name">
          <ng-template wjDockItem let-item>
            @let icon = icons.get(item);
            @if (icon) {
              <wj-icon class="glyph" [icon]="icon" />
            }
          </ng-template>
        </wj-dock>
      </div>
    }
  `,
  styles: `
    .glyph {
      font-size: 1.5rem;
    }

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

  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.home, wjIconHouse],
    [this.search, wjIconSearch],
    [this.settings, wjIconSettings],
  ]);
}
