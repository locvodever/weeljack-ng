import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import {
  WjIcon,
  wjIconChevronRight,
  wjIconFolder,
  wjIconPlus,
  wjIconPrinter,
  wjIconUpload,
  type WjIconDef,
} from 'weeljack-ng/icon';
import { WjTieredMenu, WjTieredMenuItemSlot } from 'weeljack-ng/tieredmenu';

@Component({
  selector: 'docs-tieredmenu-item-slot-example',
  imports: [WjTieredMenu, WjTieredMenuItemSlot, WjIcon],
  template: `
    <wj-tieredmenu class="column" [model]="items" ariaLabel="File">
      <ng-template wjTieredMenuItem let-item let-hasSubmenu="hasSubmenu">
        @let icon = icons.get(item);
        @if (icon) {
          <wj-icon [icon]="icon" />
        }
        <span>{{ item.label }}</span>
        @if (hasSubmenu) {
          <wj-icon class="chevron" [icon]="chevronRight" />
        }
      </ng-template>
    </wj-tieredmenu>
  `,
  styles: `
    .column {
      max-inline-size: 16rem;
    }

    .chevron {
      margin-inline-start: auto;
    }
  `,
})
export class TieredMenuItemSlotExample {
  protected readonly chevronRight = wjIconChevronRight;
  private readonly create: WjMenuItem = {
    label: 'New',
    items: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Folder' }],
  };
  private readonly open: WjMenuItem = { label: 'Open…' };
  private readonly share: WjMenuItem = {
    label: 'Export',
    items: [{ label: 'PDF' }, { label: 'CSV' }],
  };
  private readonly print: WjMenuItem = { label: 'Print…' };
  protected readonly items: WjMenuItem[] = [
    this.create,
    this.open,
    this.share,
    { separator: true },
    this.print,
  ];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.create, wjIconPlus],
    [this.open, wjIconFolder],
    [this.share, wjIconUpload],
    [this.print, wjIconPrinter],
  ]);
}
