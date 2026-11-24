import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjMenubar } from 'weeljack-ng/menubar';

@Component({
  selector: 'docs-menubar-basic-example',
  imports: [WjMenubar],
  template: `
    <wj-menubar [model]="items" ariaLabel="Editor" />
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class MenubarBasicExample {
  protected readonly status = signal('No command yet');

  /** `event.item` is the very object in `items`: the same reference, not a copy. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Last command: ${event.item.label ?? ''}`);
  };

  protected readonly items: WjMenuItem[] = [
    {
      label: 'File',
      items: [
        { label: 'New', command: this.run },
        { label: 'Open…', command: this.run },
        { label: 'Save', command: this.run },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', command: this.run },
        { label: 'Redo', command: this.run },
        { separator: true },
        { label: 'Cut', command: this.run },
        { label: 'Copy', command: this.run },
        { label: 'Paste', command: this.run },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom in', command: this.run },
        { label: 'Zoom out', command: this.run },
      ],
    },
    { label: 'Help', items: [{ label: 'About', command: this.run }] },
  ];
}
