import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjDock, WjDockItemSlot } from 'weeljack-ng/dock';
import {
  WjIcon,
  wjIconBookmark,
  wjIconHouse,
  wjIconMenu,
  wjIconShare2,
  type WjIconDef,
} from 'weeljack-ng/icon';

@Component({
  selector: 'docs-dock-commands-example',
  imports: [WjDock, WjDockItemSlot, WjIcon],
  template: `
    <div class="stage">
      <p class="status" role="status">{{ status() }}</p>
      <wj-dock [model]="items" ariaLabel="Shortcuts">
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

    .stage {
      position: relative;
      inline-size: 100%;
      block-size: 16rem;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      background: var(--wj-content-hover-background);
      color: var(--wj-text-color);
    }

    .status {
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
export class DockCommandsExample {
  protected readonly status = signal('No command yet');

  /** `event.item` is your own item, the same reference as in `items`. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Last command: ${event.item.label ?? ''}`);
  };

  private readonly home: WjMenuItem = { label: 'Home', routerLink: '/' };
  private readonly menu: WjMenuItem = { label: 'Menu docs', routerLink: ['/components', 'menu'] };
  private readonly bookmark: WjMenuItem = { label: 'Bookmark', command: this.run };
  private readonly share: WjMenuItem = { label: 'Share', command: this.run };

  protected readonly items: WjMenuItem[] = [this.home, this.menu, this.bookmark, this.share];

  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.home, wjIconHouse],
    [this.menu, wjIconMenu],
    [this.bookmark, wjIconBookmark],
    [this.share, wjIconShare2],
  ]);
}
