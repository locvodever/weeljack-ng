import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-groups-example',
  imports: [WjMenu],
  template: `
    <div class="column">
      <p id="menu-groups-caption" class="caption">Document</p>
      <wj-menu [model]="items" ariaLabelledBy="menu-groups-caption" />
    </div>
  `,
  styles: `
    .column {
      max-inline-size: 16rem;
    }

    .caption {
      margin: 0 0 8px;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class MenuGroupsExample {
  protected readonly items: WjMenuItem[] = [
    { label: 'File', items: [{ label: 'New' }, { label: 'Open…' }, { label: 'Save' }] },
    { separator: true },
    { label: 'Edit', items: [{ label: 'Undo' }, { label: 'Redo' }, { label: 'Find…' }] },
  ];
}
