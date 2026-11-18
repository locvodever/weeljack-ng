import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjDock, WjDockItemSlot } from 'weeljack-ng/dock';

@Component({
  selector: 'docs-dock-commands-example',
  imports: [WjDock, WjDockItemSlot],
  template: `
    <div class="stage">
      <p class="status" role="status">{{ status() }}</p>
      <wj-dock [model]="items" ariaLabel="Shortcuts">
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

  protected readonly icons = new Map<WjMenuItem, string>([
    [this.home, 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
    [this.menu, 'M4 6h16M4 12h16M4 18h16'],
    [this.bookmark, 'M6 3h12v18l-6-4-6 4z'],
    [this.share, 'M12 3v12M8 7l4-4 4 4M5 13v7h14v-7'],
  ]);
}
