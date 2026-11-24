import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjPanelMenu } from 'weeljack-ng/panelmenu';

@Component({
  selector: 'docs-panelmenu-multiple-example',
  imports: [WjPanelMenu],
  template: `
    <div class="column">
      <nav aria-label="Documentation">
        <wj-panelmenu [model]="items" multiple />
      </nav>
      <p class="status" role="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    .column {
      max-inline-size: 18rem;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PanelmenuMultipleExample {
  protected readonly status = signal('Nothing opened yet');

  private readonly open = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Opened: ${event.item.label ?? ''}`);
  };

  private readonly page = (label: string): WjMenuItem => ({ label, command: this.open });

  protected readonly items: WjMenuItem[] = [
    {
      label: 'Form',
      items: [
        this.page('Button'),
        this.page('Input text'),
        this.page('Select'),
        this.page('Checkbox'),
      ],
    },
    {
      label: 'Data',
      items: [this.page('Table'), this.page('Paginator'), this.page('Data view')],
    },
    {
      label: 'Overlays',
      items: [this.page('Dialog'), this.page('Drawer'), this.page('Sheet')],
    },
  ];
}
