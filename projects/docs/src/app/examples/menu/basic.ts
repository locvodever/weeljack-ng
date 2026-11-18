import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-basic-example',
  imports: [WjMenu],
  template: `<wj-menu class="column" [model]="items" ariaLabel="File" />`,
  styles: `
    .column {
      max-inline-size: 16rem;
    }
  `,
})
export class MenuBasicExample {
  protected readonly items: WjMenuItem[] = [
    { label: 'New' },
    { label: 'Open…' },
    { label: 'Save' },
    { label: 'Save as…' },
    { label: 'Print…' },
  ];
}
