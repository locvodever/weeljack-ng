import { Component, computed, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-popup-example',
  imports: [WjButton, WjMenu],
  template: `
    <div class="row">
      <wj-button
        label="Actions"
        severity="secondary"
        variant="outlined"
        [pt]="triggerPt()"
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
    <wj-menu
      #menu
      [model]="items"
      [popup]="true"
      ariaLabel="Actions"
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
export class MenuPopupExample {
  protected readonly open = signal(false);
  protected readonly items: WjMenuItem[] = [
    { label: 'Edit' },
    { label: 'Duplicate' },
    { label: 'Archive' },
    { separator: true },
    { label: 'Delete' },
  ];

  /** `wj-button` has no ARIA inputs for a popup trigger yet: set them on its button through `pt`. */
  protected readonly triggerPt = computed<WjButtonPt>(() => ({
    root: { 'aria-haspopup': 'menu', 'aria-expanded': String(this.open()) },
  }));
}
