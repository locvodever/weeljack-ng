import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjContextMenu } from 'weeljack-ng/contextmenu';
import { WjField } from 'weeljack-ng/field';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';

@Component({
  selector: 'docs-contextmenu-global-example',
  imports: [WjContextMenu, WjField, WjToggleSwitch],
  template: `
    <wj-field
      label="Page menu"
      hint="While it is on, this menu replaces the browser’s own on the whole page."
    >
      <wj-toggleswitch [(checked)]="on" />
    </wj-field>
    @if (on()) {
      <wj-contextmenu global [model]="items" ariaLabel="Page" />
    }
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ContextMenuGlobalExample {
  protected readonly on = signal(false);
  protected readonly status = signal('Turn it on, then right-click anywhere');

  protected readonly items: WjMenuItem[] = [
    {
      label: 'Copy page link',
      command: () => {
        this.status.set('Last command: Copy page link');
      },
    },
    {
      label: 'Print page…',
      command: () => {
        this.status.set('Last command: Print page…');
      },
    },
    { separator: true },
    {
      label: 'Turn off page menu',
      command: () => {
        this.on.set(false);
        this.status.set('The page menu is off');
      },
    },
  ];
}
