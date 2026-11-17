import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-disabled-example',
  imports: [WjMenu],
  template: `<wj-menu class="column" [model]="items" ariaLabel="Edit" />`,
  styles: `
    .column {
      max-inline-size: 16rem;
    }
  `,
})
export class MenuDisabledExample {
  protected readonly items: WjMenuItem[] = [
    { label: 'Cut' },
    { label: 'Copy' },
    { label: 'Paste', disabled: true },
    { separator: true },
    { label: 'Select all' },
  ];
}
