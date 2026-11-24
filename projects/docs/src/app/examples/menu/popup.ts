import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjIcon, wjIconChevronDown } from 'weeljack-ng/icon';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-popup-example',
  imports: [WjButton, WjMenu, WjIcon],
  template: `
    <div class="row">
      <wj-button
        label="Actions"
        severity="secondary"
        variant="outlined"
        ariaHasPopup="menu"
        [ariaExpanded]="open()"
        (click)="menu.toggle($event)"
      >
        <wj-icon [icon]="chevronDown" />
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
  protected readonly chevronDown = wjIconChevronDown;
  protected readonly open = signal(false);
  protected readonly items: WjMenuItem[] = [
    { label: 'Edit' },
    { label: 'Duplicate' },
    { label: 'Archive' },
    { separator: true },
    { label: 'Delete' },
  ];
}
