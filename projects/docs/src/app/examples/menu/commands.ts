import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjMenu } from 'weeljack-ng/menu';

@Component({
  selector: 'docs-menu-commands-example',
  imports: [WjMenu],
  template: `
    <div class="column">
      <wj-menu [model]="items" ariaLabel="Clipboard" />
      <p class="status" role="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    .column {
      max-inline-size: 16rem;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class MenuCommandsExample {
  protected readonly status = signal('No command yet');

  /** `event.item` is the very object in `items`: the same reference, not a copy. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Last command: ${event.item.label ?? ''}`);
  };

  protected readonly items: WjMenuItem[] = [
    { label: 'Cut', command: this.run },
    { label: 'Copy', command: this.run },
    { label: 'Paste', command: this.run },
  ];
}
