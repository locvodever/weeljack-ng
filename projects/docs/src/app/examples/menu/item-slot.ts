import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjIcon, wjIconFolder, wjIconPlus, wjIconSave, type WjIconDef } from 'weeljack-ng/icon';
import { WjMenu, WjMenuItemSlot } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-item-slot-example',
  imports: [WjMenu, WjMenuItemSlot, WjIcon],
  template: `
    <wj-menu class="column" [model]="items" ariaLabel="File">
      <ng-template wjMenuItem let-item>
        @let icon = icons.get(item);
        @if (icon) {
          <wj-icon [icon]="icon" />
        }
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
  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.create, wjIconPlus],
    [this.open, wjIconFolder],
    [this.save, wjIconSave],
  ]);
}
