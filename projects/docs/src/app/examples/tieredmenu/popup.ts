import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjTieredMenu } from 'weeljack-ng/tieredmenu';

@Component({
  selector: 'docs-tieredmenu-popup-example',
  imports: [WjButton, WjTieredMenu],
  template: `
    <div class="row">
      <wj-button
        label="File"
        severity="secondary"
        variant="outlined"
        ariaHasPopup="menu"
        [ariaExpanded]="open()"
        (click)="menu.toggle($event)"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </wj-button>
    </div>
    <wj-tieredmenu
      #menu
      [model]="items"
      [popup]="true"
      ariaLabel="File"
      (opened)="open.set(true)"
      (closed)="open.set(false)"
    />
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class TieredMenuPopupExample {
  protected readonly open = signal(false);
  protected readonly items: WjMenuItem[] = [
    { label: 'New', items: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Folder' }] },
    { label: 'Open…' },
    { label: 'Export', items: [{ label: 'PDF' }, { label: 'CSV' }] },
    { separator: true },
    { label: 'Print…' },
  ];
}
