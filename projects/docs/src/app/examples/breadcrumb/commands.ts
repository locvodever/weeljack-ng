import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjBreadcrumb } from 'weeljack-ng/breadcrumb';

@Component({
  selector: 'docs-breadcrumb-commands-example',
  imports: [WjBreadcrumb],
  template: `
    <div class="column">
      <wj-breadcrumb [home]="home" [model]="items" />
      <p class="status" role="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    .column {
      inline-size: 100%;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class BreadcrumbCommandsExample {
  protected readonly status = signal('No item yet');

  /**
   * `event.item` is your own item, the same reference as in `items`. This command also stops the
   * link from navigating, so the example stays on this page and the links stay keyboard-operable.
   */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    event.originalEvent.preventDefault();
    this.status.set(`Last item: ${event.item.label ?? 'Home'}`);
  };

  protected readonly home: WjMenuItem = { url: '/', command: this.run };

  protected readonly items: WjMenuItem[] = [
    { label: 'Menu', url: '/components/menu', command: this.run },
    { label: 'Breadcrumb' },
  ];
}
