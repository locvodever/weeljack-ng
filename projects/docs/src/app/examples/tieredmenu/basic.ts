import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjTieredMenu } from 'weeljack-ng/tieredmenu';

@Component({
  selector: 'docs-tieredmenu-basic-example',
  imports: [WjTieredMenu],
  template: `<wj-tieredmenu class="column" [model]="items" ariaLabel="File" />`,
  styles: `
    .column {
      max-inline-size: 16rem;
    }
  `,
})
export class TieredMenuBasicExample {
  protected readonly items: WjMenuItem[] = [
    { label: 'New', items: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Folder' }] },
    { label: 'Open…' },
    { label: 'Export', items: [{ label: 'PDF' }, { label: 'CSV' }] },
    { separator: true },
    { label: 'Print…' },
  ];
}
