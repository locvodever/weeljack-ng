import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjContextMenu, WjContextMenuItemSlot } from 'weeljack-ng/contextmenu';
import {
  WjIcon,
  wjIconChevronRight,
  wjIconFolder,
  wjIconPencil,
  wjIconShare2,
  wjIconTrash,
  type WjIconDef,
} from 'weeljack-ng/icon';

@Component({
  selector: 'docs-contextmenu-item-slot-example',
  imports: [WjContextMenu, WjContextMenuItemSlot, WjIcon],
  template: `
    <div #region class="region" role="group" aria-label="report.pdf" tabindex="0">
      <span class="name">report.pdf</span>
      <span class="hint">Right-click, or focus and press Shift+F10</span>
    </div>
    <wj-contextmenu [target]="region" [model]="items" ariaLabel="report.pdf">
      <ng-template wjContextMenuItem let-item>
        @let icon = icons.get(item);
        @if (icon) {
          <wj-icon [icon]="icon" />
        }
        <span>{{ item.label }}</span>
        @if (item.items) {
          <wj-icon class="chevron" [icon]="chevronRight" />
        }
      </ng-template>
    </wj-contextmenu>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .region {
      display: grid;
      gap: 4px;
      padding: 24px;
      border: 1px dashed var(--wj-content-border-color);
      border-radius: 12px;
    }

    .region:focus-visible {
      outline: var(--wj-focus-ring-width, 2px) var(--wj-focus-ring-style, solid)
        var(--wj-focus-ring-color);
      outline-offset: var(--wj-focus-ring-offset, 2px);
    }

    .hint {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }

    .chevron {
      margin-inline-start: auto;
    }
  `,
})
export class ContextMenuItemSlotExample {
  protected readonly chevronRight = wjIconChevronRight;
  private readonly open: WjMenuItem = { label: 'Open' };
  private readonly rename: WjMenuItem = { label: 'Rename…' };
  private readonly share: WjMenuItem = {
    label: 'Share',
    items: [{ label: 'Copy link' }, { label: 'Email…' }],
  };
  private readonly remove: WjMenuItem = { label: 'Delete' };
  protected readonly items: WjMenuItem[] = [
    this.open,
    this.rename,
    this.share,
    { separator: true },
    this.remove,
  ];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.open, wjIconFolder],
    [this.rename, wjIconPencil],
    [this.share, wjIconShare2],
    [this.remove, wjIconTrash],
  ]);
}
