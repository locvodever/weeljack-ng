import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjContextMenu, WjContextMenuItemSlot } from 'weeljack-ng/contextmenu';

@Component({
  selector: 'docs-contextmenu-item-slot-example',
  imports: [WjContextMenu, WjContextMenuItemSlot],
  template: `
    <div #region class="region" role="group" aria-label="report.pdf" tabindex="0">
      <span class="name">report.pdf</span>
      <span class="hint">Right-click, or focus and press Shift+F10</span>
    </div>
    <wj-contextmenu [target]="region" [model]="items" ariaLabel="report.pdf">
      <ng-template wjContextMenuItem let-item>
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
        @if (item.items) {
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
  protected readonly icons = new Map<WjMenuItem, string>([
    [this.open, 'M2 5h5l1 1h6v7H2z'],
    [this.rename, 'M3 13l1-3 7-7 2 2-7 7zM10 4l2 2'],
    [this.share, 'M8 11V3m0 0L5 6m3-3 3 3M3 13h10'],
    [this.remove, 'M3 4h10M6 4V2h4v2M5 4l1 9h4l1-9'],
  ]);
}
