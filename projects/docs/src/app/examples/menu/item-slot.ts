import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjMenu, WjMenuItemSlot } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-item-slot-example',
  imports: [WjMenu, WjMenuItemSlot],
  template: `
    <wj-menu class="column" [model]="items" ariaLabel="File">
      <ng-template wjMenuItem let-item>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path [attr.d]="icons.get(item)" />
        </svg>
        <span>{{ item.label }}</span>
      </ng-template>
    </wj-menu>
  `,
  styles: `
    .column {
      max-inline-size: 16rem;
    }
  `,
})
export class MenuItemSlotExample {
  private readonly create: WjMenuItem = { label: 'New' };
  private readonly open: WjMenuItem = { label: 'Open…' };
  private readonly save: WjMenuItem = { label: 'Save' };
  protected readonly items: WjMenuItem[] = [this.create, this.open, this.save];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, string>([
    [this.create, 'M8 3v10M3 8h10'],
    [this.open, 'M2 5h5l1 1h6v7H2z'],
    [this.save, 'M3 3h8l2 2v8H3zM5 3v4h5V3'],
  ]);
}
