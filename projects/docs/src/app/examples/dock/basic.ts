import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjDock, WjDockItemSlot } from 'weeljack-ng/dock';
import {
  WjIcon,
  wjIconCalendar,
  wjIconHouse,
  wjIconMail,
  wjIconSearch,
  wjIconSettings,
  type WjIconDef,
} from 'weeljack-ng/icon';

@Component({
  selector: 'docs-dock-basic-example',
  imports: [WjDock, WjDockItemSlot, WjIcon],
  template: `
    <div class="stage">
      <wj-dock [model]="items" ariaLabel="Apps">
        <ng-template wjDockItem let-item>
          @let icon = icons.get(item);
          @if (icon) {
            <wj-icon class="glyph" [icon]="icon" />
          }
        </ng-template>
      </wj-dock>
    </div>
  `,
  styles: `
    .glyph {
      font-size: 1.5rem;
    }

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
  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.home, wjIconHouse],
    [this.search, wjIconSearch],
    [this.mail, wjIconMail],
    [this.calendar, wjIconCalendar],
    [this.settings, wjIconSettings],
  ]);
}
