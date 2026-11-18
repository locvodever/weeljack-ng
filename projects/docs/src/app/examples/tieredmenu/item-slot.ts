import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjTieredMenu, WjTieredMenuItemSlot } from 'weeljack-ng/tieredmenu';

@Component({
  selector: 'docs-tieredmenu-item-slot-example',
  imports: [WjTieredMenu, WjTieredMenuItemSlot],
  template: `
    <wj-tieredmenu class="column" [model]="items" ariaLabel="File">
      <ng-template wjTieredMenuItem let-item let-hasSubmenu="hasSubmenu">
        @let icon = icons.get(item);
        @if (icon) {
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path [attr.d]="icon" />
          </svg>
        }
        <span>{{ item.label }}</span>
        @if (hasSubmenu) {
          <svg
            class="chevron"
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="m6 4 4 4-4 4" />
          </svg>
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
  protected readonly icons = new Map<WjMenuItem, string>([
    [this.create, 'M8 3v10M3 8h10'],
    [this.open, 'M2 5h5l1 1h6v7H2z'],
    [this.share, 'M8 11V3m0 0L5 6m3-3 3 3M3 13h10'],
    [this.print, 'M4 6V2h8v4M4 12H2V6h12v6h-2M4 9h8v5H4z'],
  ]);
}
